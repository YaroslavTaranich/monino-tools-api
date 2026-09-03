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
