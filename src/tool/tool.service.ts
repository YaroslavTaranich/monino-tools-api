import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tool } from './tool.model';
import { CreateToolDto } from './dto/create-tool.dto';
import { validate } from 'class-validator';
import { FileService } from '../file/file.service';
import { QueryTypes, Transaction } from 'sequelize';
import { ToolType } from '../tool-type/tool-type.model';

@Injectable()
export class ToolService {
  constructor(
    @InjectModel(Tool) private toolRepository: typeof Tool,
    @InjectModel(ToolType) private toolTypeRepository: typeof ToolType,
    private readonly fileService: FileService,
  ) {}

  async createTool(dto: CreateToolDto) {
    try {
      const typeFields = await this.resolveToolType(dto);
      const { related_tool_ids, ...fields } = dto;
      const id = await this.toolRepository.sequelize.transaction(
        async (transaction) => {
          await this.lockRelations(transaction);
          const tool = await this.toolRepository.create(
            { ...fields, ...typeFields },
            { transaction },
          );
          await this.saveRelations(tool, related_tool_ids ?? [], transaction);
          return tool.id;
        },
      );
      return this.getOneToolById(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllTools() {
    try {
      return this.withRelations(
        await this.toolRepository.findAll({ include: [ToolType] }),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllToolsByCategoryId(categoryId: number) {
    try {
      return this.withRelations(
        await this.toolRepository.findAll({
          where: { categoryId },
          include: [ToolType],
        }),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getOneToolById(id: number) {
    const tool = await this.toolRepository.findOne({
      where: { id },
      include: [ToolType],
    });
    if (!tool) {
      throw new NotFoundException(`Инструмент с ID ${id} не найден`);
    }
    await this.withRelations([tool]);
    return tool;
  }

  async updateToolById(id: number, newData: CreateToolDto) {
    const updateDto = Object.assign(new CreateToolDto(), newData);

    const errors = await validate(updateDto);
    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) => Object.values(error.constraints))
        .join(', ');
      throw new BadRequestException(errorMessage);
    }

    const typeFields = await this.resolveToolType(newData);
    const { related_tool_ids, ...fields } = newData;
    await this.toolRepository.sequelize.transaction(async (transaction) => {
      await this.lockRelations(transaction);
      const tool = await this.toolRepository.findByPk(id, { transaction });
      if (!tool) throw new NotFoundException(`Инструмент с ID ${id} не найден`);
      await tool.update({ ...fields, ...typeFields }, { transaction });
      const ids =
        related_tool_ids ?? (await this.relatedIds(tool.id, transaction));
      await this.saveRelations(tool, ids, transaction);
    });

    return this.getOneToolById(id);
  }

  async deleteToolById(id: number) {
    await this.toolRepository.sequelize.transaction(async (transaction) => {
      await this.lockRelations(transaction);
      await this.toolRepository.destroy({ where: { id }, transaction });
    });
    return 'Удалено';
  }

  async updateToolImage(id: number, file: Express.Multer.File) {
    const tool = await this.getOneToolById(id);
    const path = await this.fileService.changeImage(file, tool.image);
    console.log('updating image in tool');
    tool.image = path || null;
    await tool.save();
    return tool;
  }

  // Serialize catalog relationship edits, including role changes and deletions.
  private async lockRelations(transaction: Transaction) {
    await this.toolRepository.sequelize.query(
      'SELECT pg_advisory_xact_lock(701007)',
      { transaction },
    );
  }

  private async relatedIds(
    id: number,
    transaction: Transaction,
  ): Promise<number[]> {
    const rows = await this.toolRepository.sequelize.query<{ id: number }>(
      `
      SELECT CASE WHEN tool_id = :id THEN accessory_tool_id ELSE tool_id END AS id
      FROM tool_accessories WHERE tool_id = :id OR accessory_tool_id = :id
      ORDER BY CASE WHEN tool_id = :id THEN tool_sort_order ELSE accessory_sort_order END, id
    `,
      { replacements: { id }, type: QueryTypes.SELECT, transaction },
    );
    return rows.map((row) => row.id);
  }

  private async saveRelations(
    tool: Tool,
    ids: number[],
    transaction: Transaction,
  ) {
    if (ids.includes(tool.id) || new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'Нельзя связать позицию с собой или добавить связь дважды',
      );
    }
    if (ids.length) {
      const targets = await this.toolRepository.findAll({
        where: { id: ids },
        transaction,
      });
      if (targets.length !== ids.length)
        throw new BadRequestException('Связанная позиция не найдена');
      if (
        targets.some((target) => target.accessory_only === tool.accessory_only)
      ) {
        throw new BadRequestException(
          'Связь должна соединять основной инструмент и дополнение. Перед сменой назначения удалите несовместимые связи.',
        );
      }
    }
    await this.toolRepository.sequelize.query(
      `
      DELETE FROM tool_accessories
      WHERE (tool_id = :id OR accessory_tool_id = :id)
      ${
        ids.length
          ? 'AND (CASE WHEN tool_id = :id THEN accessory_tool_id ELSE tool_id END) NOT IN (:ids)'
          : ''
      }
    `,
      { replacements: { id: tool.id, ids }, transaction },
    );
    for (const [order, targetId] of ids.entries()) {
      const left = Math.min(tool.id, targetId);
      const right = Math.max(tool.id, targetId);
      const orderColumn =
        tool.id === left ? 'tool_sort_order' : 'accessory_sort_order';
      await this.toolRepository.sequelize.query(
        `
        INSERT INTO tool_accessories (tool_id, accessory_tool_id, ${orderColumn})
        VALUES (:left, :right, :order)
        ON CONFLICT (tool_id, accessory_tool_id) DO UPDATE SET ${orderColumn} = EXCLUDED.${orderColumn}
      `,
        { replacements: { left, right, order }, transaction },
      );
    }
  }

  private async withRelations(tools: Tool[]) {
    if (!tools.length) return tools;
    const rows = await this.toolRepository.sequelize.query<{
      source_id: number;
      id: number;
      name: string;
      label: string;
      image: string;
      price: number;
      zalog: number;
      categoryId: number;
      accessory_only: boolean;
    }>(
      `
      SELECT links.source_id, t.id, t.name, t.label, t.image, t.price, t.zalog,
             t."categoryId", t.accessory_only
      FROM (
        SELECT tool_id AS source_id, accessory_tool_id AS target_id, tool_sort_order AS sort_order
        FROM tool_accessories
        UNION ALL
        SELECT accessory_tool_id, tool_id, accessory_sort_order FROM tool_accessories
      ) links JOIN tools t ON t.id = links.target_id
      WHERE links.source_id IN (:ids)
      ORDER BY links.source_id, links.sort_order, t.id
    `,
      {
        replacements: { ids: tools.map((tool) => tool.id) },
        type: QueryTypes.SELECT,
      },
    );
    for (const tool of tools) {
      const related = rows
        .filter((row) => row.source_id === tool.id)
        .map((row) => ({
          id: row.id,
          name: row.name,
          label: row.label,
          image: row.image,
          price: row.price,
          zalog: row.zalog,
          categoryId: row.categoryId,
          accessory_only: row.accessory_only,
        }));
      tool.setDataValue('related_tools' as never, related as never);
      tool.setDataValue(
        'related_tool_ids' as never,
        related.map((item) => item.id) as never,
      );
    }
    return tools;
  }

  private async resolveToolType(dto: CreateToolDto) {
    if (!dto.tool_type_id) {
      throw new BadRequestException('Необходимо выбрать тип инструмента');
    }

    const toolType = await this.toolTypeRepository.findByPk(dto.tool_type_id);
    if (!toolType) {
      throw new BadRequestException(
        `Тип инструмента с ID ${dto.tool_type_id} не найден`,
      );
    }
    return { tool_type_id: toolType.id };
  }
}
