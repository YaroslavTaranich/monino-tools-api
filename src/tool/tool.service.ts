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
import { ToolImage } from './tool-image.model';

@Injectable()
export class ToolService {
  constructor(
    @InjectModel(Tool) private toolRepository: typeof Tool,
    @InjectModel(ToolType) private toolTypeRepository: typeof ToolType,
    @InjectModel(ToolImage) private toolImageRepository: typeof ToolImage,
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
      return this.withCatalogData(
        await this.toolRepository.findAll({ include: [ToolType] }),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllToolsByCategoryId(categoryId: number) {
    try {
      return this.withCatalogData(
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
    await this.withCatalogData([tool]);
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
      if (fields.label) {
        await this.toolImageRepository.update(
          { alt: fields.label },
          { where: { tool_id: id }, transaction },
        );
      }
      const ids =
        related_tool_ids ?? (await this.relatedIds(tool.id, transaction));
      await this.saveRelations(tool, ids, transaction);
    });

    return this.getOneToolById(id);
  }

  async deleteToolById(id: number) {
    const images = await this.toolImageRepository.findAll({
      where: { tool_id: id },
    });
    await this.toolRepository.sequelize.transaction(async (transaction) => {
      await this.lockRelations(transaction);
      await this.toolRepository.destroy({ where: { id }, transaction });
    });
    for (const image of images) {
      await this.removeImageIfUnused(image.storage_key);
    }
    return 'Удалено';
  }

  async updateToolImage(id: number, file: Express.Multer.File) {
    await this.getOneToolById(id);
    const stored = await this.fileService.storeImage(file);
    let oldPath: string;
    try {
      await this.toolRepository.sequelize.transaction(async (transaction) => {
        const tool = await this.lockTool(id, transaction);
        const cover = await this.toolImageRepository.findOne({
          where: { tool_id: id, is_cover: true },
          transaction,
        });
        oldPath = cover?.storage_key;
        if (cover) {
          await cover.update({ ...stored, alt: tool.label }, { transaction });
        } else {
          const imageCount = await this.toolImageRepository.count({
            where: { tool_id: id },
            transaction,
          });
          if (imageCount >= 5) {
            throw new BadRequestException(
              'У инструмента уже загружено пять фотографий',
            );
          }
          await this.toolImageRepository.create(
            {
              tool_id: id,
              ...stored,
              sort_order: 0,
              is_cover: true,
              alt: tool.label,
            },
            { transaction },
          );
        }
      });
    } catch (error) {
      this.fileService.removeFile(stored.storage_key);
      throw error;
    }
    if (oldPath && oldPath !== stored.storage_key) {
      await this.removeImageIfUnused(oldPath);
    }
    return this.getOneToolById(id);
  }

  async uploadToolImages(id: number, files: Express.Multer.File[]) {
    if (!files.length) {
      throw new BadRequestException('Выберите хотя бы одну фотографию');
    }
    await this.getOneToolById(id);
    const storedImages = [];
    try {
      for (const file of files) {
        storedImages.push(await this.fileService.storeImage(file));
      }
      await this.toolRepository.sequelize.transaction(async (transaction) => {
        const tool = await this.lockTool(id, transaction);
        const currentCount = await this.toolImageRepository.count({
          where: { tool_id: id },
          transaction,
        });
        if (currentCount + storedImages.length > 5) {
          throw new BadRequestException(
            'У инструмента может быть не больше пяти фотографий',
          );
        }
        const lastImage = await this.toolImageRepository.findOne({
          where: { tool_id: id },
          order: [
            ['sort_order', 'DESC'],
            ['id', 'DESC'],
          ],
          transaction,
        });
        const firstSortOrder = (lastImage?.sort_order ?? -1) + 1;
        for (const [index, stored] of storedImages.entries()) {
          const isCover = currentCount === 0 && index === 0;
          await this.toolImageRepository.create(
            {
              tool_id: id,
              ...stored,
              sort_order: firstSortOrder + index,
              is_cover: isCover,
              alt: tool.label,
            },
            { transaction },
          );
        }
      });
    } catch (error) {
      for (const stored of storedImages) {
        this.fileService.removeFile(stored.storage_key);
      }
      throw error;
    }
    return this.getOneToolById(id);
  }

  async sortToolImages(id: number, imageIds: number[]) {
    await this.toolRepository.sequelize.transaction(async (transaction) => {
      await this.lockTool(id, transaction);
      const images = await this.toolImageRepository.findAll({
        where: { tool_id: id },
        order: [
          ['sort_order', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction,
      });
      const currentIds = images.map((image) => image.id).sort((a, b) => a - b);
      const requestedIds = [...imageIds].sort((a, b) => a - b);
      if (
        currentIds.length !== requestedIds.length ||
        currentIds.some((imageId, index) => imageId !== requestedIds[index])
      ) {
        throw new BadRequestException(
          'Передайте все фотографии инструмента без повторений',
        );
      }
      for (const [sortOrder, imageId] of imageIds.entries()) {
        await this.toolImageRepository.update(
          { sort_order: sortOrder },
          { where: { id: imageId, tool_id: id }, transaction },
        );
      }
    });
    return this.getOneToolById(id);
  }

  async setToolImageCover(id: number, imageId: number) {
    await this.toolRepository.sequelize.transaction(async (transaction) => {
      await this.lockTool(id, transaction);
      const image = await this.toolImageRepository.findOne({
        where: { id: imageId, tool_id: id },
        transaction,
      });
      if (!image) throw new NotFoundException('Фотография не найдена');
      if (!image.is_cover) {
        await this.toolImageRepository.update(
          { is_cover: false },
          { where: { tool_id: id }, transaction },
        );
        await this.toolImageRepository.update(
          { is_cover: true },
          { where: { id: image.id, tool_id: id }, transaction },
        );
      }
    });
    return this.getOneToolById(id);
  }

  async deleteToolImage(id: number, imageId: number) {
    let deletedPath: string;
    await this.toolRepository.sequelize.transaction(async (transaction) => {
      await this.lockTool(id, transaction);
      const image = await this.toolImageRepository.findOne({
        where: { id: imageId, tool_id: id },
        transaction,
      });
      if (!image) throw new NotFoundException('Фотография не найдена');
      deletedPath = image.storage_key;
      const wasCover = image.is_cover;
      await image.destroy({ transaction });
      if (wasCover) {
        const nextCover = await this.toolImageRepository.findOne({
          where: { tool_id: id },
          order: [
            ['sort_order', 'ASC'],
            ['id', 'ASC'],
          ],
          transaction,
        });
        if (nextCover) {
          await nextCover.update({ is_cover: true }, { transaction });
        }
      }
    });
    await this.removeImageIfUnused(deletedPath);
    return this.getOneToolById(id);
  }

  private async lockTool(id: number, transaction: Transaction) {
    const tool = await this.toolRepository.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!tool) throw new NotFoundException(`Инструмент с ID ${id} не найден`);
    return tool;
  }

  private async removeImageIfUnused(storageKey: string) {
    if (!storageKey) return;
    const references = await this.toolImageRepository.count({
      where: { storage_key: storageKey },
    });
    if (references === 0) this.fileService.removeFile(storageKey);
  }

  private async withCatalogData(tools: Tool[]) {
    await this.withRelations(tools);
    await this.withImages(tools);
    return tools;
  }

  private async withImages(tools: Tool[]) {
    if (!tools.length) return tools;
    const images = await this.toolImageRepository.findAll({
      where: { tool_id: tools.map((tool) => tool.id) },
      order: [
        ['tool_id', 'ASC'],
        ['sort_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    for (const tool of tools) {
      const toolImages = images.filter((image) => image.tool_id === tool.id);
      tool.setDataValue('images', toolImages as never);
      tool.setDataValue(
        'image' as never,
        (toolImages.find((image) => image.is_cover)?.storage_key ??
          null) as never,
      );
    }
    return tools;
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
      SELECT links.source_id, t.id, t.name, t.label,
             cover.storage_key AS image, t.price, t.zalog,
             t."categoryId", t.accessory_only
      FROM (
        SELECT tool_id AS source_id, accessory_tool_id AS target_id, tool_sort_order AS sort_order
        FROM tool_accessories
        UNION ALL
        SELECT accessory_tool_id, tool_id, accessory_sort_order FROM tool_accessories
      ) links JOIN tools t ON t.id = links.target_id
      LEFT JOIN tool_images cover ON cover.tool_id = t.id AND cover.is_cover = TRUE
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
