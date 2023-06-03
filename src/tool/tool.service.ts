import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tool } from './tool.model';
import { CreateToolDto } from './dto/create-tool.dto';
import { validate } from 'class-validator';

@Injectable()
export class ToolService {
  constructor(@InjectModel(Tool) private toolRepository: typeof Tool) {}

  async createTool(dto: CreateToolDto) {
    try {
      const ToolCreationAtrr = await this.toolRepository.create(dto);
      return ToolCreationAtrr;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllTools() {
    try {
      const tools = await this.toolRepository.findAll();
      return tools;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getOneToolById(id: number) {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Инструмент с ID ${id} не найден`);
    }
    return tool;
  }

  async updatetoolById(id: number, newData: CreateToolDto) {
    const tool = await this.getOneToolById(id);

    const updateDto = Object.assign(new CreateToolDto(), newData);

    const errors = await validate(updateDto);
    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) => Object.values(error.constraints))
        .join(', ');
      throw new BadRequestException(errorMessage);
    }

    await tool.update(newData);

    return tool;
  }

  async deleteToolById(id: number) {
    await this.toolRepository.destroy({ where: { id } });
    return 'Удалено';
  }
}
