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

@Injectable()
export class ToolService {
  constructor(
    @InjectModel(Tool) private toolRepository: typeof Tool,
    private readonly fileService: FileService,
  ) {}

  async createTool(dto: CreateToolDto) {
    try {
      return await this.toolRepository.create(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllTools() {
    try {
      return await this.toolRepository.findAll();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllToolsByCategoryId(categoryId: number) {
    try {
      return await this.toolRepository.findAll({
        where: { categoryId },
      });
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

  async updateToolById(id: number, newData: CreateToolDto) {
    const tool = await this.getOneToolById(id);

    const updateDto = Object.assign(new CreateToolDto(), newData);

    console.log(updateDto, tool);

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

  async updateToolImage(id: number, file: Express.Multer.File) {
    const tool = await this.getOneToolById(id);
    const path = await this.fileService.changeImage(file, tool.image);
    console.log('updating image in tool');
    tool.image = path || null;
    await tool.save();
    return tool;
  }
}
