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
import { ToolType } from '../tool-type/tool-type.model';
import { createHash } from 'crypto';

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
      const tool = await this.toolRepository.create({ ...dto, ...typeFields });
      return this.getOneToolById(tool.id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllTools() {
    try {
      return await this.toolRepository.findAll({ include: [ToolType] });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllToolsByCategoryId(categoryId: number) {
    try {
      return await this.toolRepository.findAll({
        where: { categoryId },
        include: [ToolType],
      });
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
    return tool;
  }

  async updateToolById(id: number, newData: CreateToolDto) {
    const tool = await this.getOneToolById(id);

    const updateDto = Object.assign(new CreateToolDto(), newData);

    const errors = await validate(updateDto);
    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) => Object.values(error.constraints))
        .join(', ');
      throw new BadRequestException(errorMessage);
    }

    const typeFields = await this.resolveToolType(newData);
    await tool.update({ ...newData, ...typeFields });

    return this.getOneToolById(id);
  }

  async deleteToolById(id: number) {
    await this.toolRepository.destroy({ where: { id } });
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

  private async resolveToolType(dto: CreateToolDto) {
    if (dto.tool_type_id) {
      const toolType = await this.toolTypeRepository.findByPk(dto.tool_type_id);
      if (!toolType) {
        throw new BadRequestException(
          `Тип инструмента с ID ${dto.tool_type_id} не найден`,
        );
      }
      return { tool_type_id: toolType.id, tool_type: toolType.name };
    }

    const legacyName = dto.tool_type?.trim();
    if (!legacyName) {
      throw new BadRequestException('Необходимо выбрать тип инструмента');
    }

    let toolType = await this.toolTypeRepository.findOne({
      where: { name: legacyName },
    });
    if (!toolType) {
      const asciiSlug = legacyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const suffix = createHash('sha256')
        .update(legacyName)
        .digest('hex')
        .slice(0, 8);
      toolType = await this.toolTypeRepository.create({
        name: legacyName,
        slug: `${asciiSlug || 'type'}-${suffix}`,
        sort_order: 0,
        is_active: true,
      });
    }
    return { tool_type_id: toolType.id, tool_type: toolType.name };
  }
}
