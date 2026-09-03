import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { Tool } from '../tool/tool.model';
import { SaveToolTypeDto } from './dto/save-tool-type.dto';
import { ToolType } from './tool-type.model';

const getSaveError = (error: unknown) => {
  const databaseError = error as {
    name?: string;
    errors?: Array<{ path?: string }>;
  };
  const isDuplicate =
    error instanceof UniqueConstraintError ||
    databaseError?.name === 'SequelizeUniqueConstraintError';

  if (isDuplicate) {
    const fields = databaseError.errors?.map(({ path }) => path) ?? [];
    if (fields.includes('name')) {
      return new ConflictException('Тип с таким названием уже существует');
    }
    if (fields.includes('slug')) {
      return new ConflictException(
        'Тип с таким системным кодом уже существует',
      );
    }
    return new ConflictException('Такой тип инструмента уже существует');
  }

  if (
    error instanceof ValidationError ||
    databaseError?.name === 'SequelizeValidationError'
  ) {
    return new BadRequestException('Проверьте правильность заполнения полей');
  }

  return new BadRequestException('Не удалось сохранить тип инструмента');
};

@Injectable()
export class ToolTypeService {
  constructor(
    @InjectModel(ToolType) private toolTypeRepository: typeof ToolType,
    @InjectModel(Tool) private toolRepository: typeof Tool,
  ) {}

  async getAll() {
    return this.toolTypeRepository.findAll({
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  async getOne(id: number) {
    const toolType = await this.toolTypeRepository.findByPk(id);
    if (!toolType) {
      throw new NotFoundException(`Тип инструмента с ID ${id} не найден`);
    }
    return toolType;
  }

  async create(dto: SaveToolTypeDto) {
    try {
      return await this.toolTypeRepository.create(dto);
    } catch (error) {
      throw getSaveError(error);
    }
  }

  async update(id: number, dto: SaveToolTypeDto) {
    try {
      const toolType = await this.toolTypeRepository.findByPk(id);
      if (!toolType) {
        throw new NotFoundException(`Тип инструмента с ID ${id} не найден`);
      }

      await toolType.update(dto);
      return toolType;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw getSaveError(error);
    }
  }

  async delete(id: number) {
    const toolType = await this.getOne(id);
    const toolsCount = await this.toolRepository.count({
      where: { tool_type_id: id },
    });
    if (toolsCount > 0) {
      throw new ConflictException(
        `Нельзя удалить тип: он назначен инструментам (${toolsCount})`,
      );
    }
    await toolType.destroy();
    return { deleted: true };
  }
}
