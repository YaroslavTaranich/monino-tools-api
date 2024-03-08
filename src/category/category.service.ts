import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from './category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { validate } from 'class-validator';
import { FileService } from '../file/file.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category) private categoryRepository: typeof Category,
    private readonly fileService: FileService,
  ) {}

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.categoryRepository.create(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllCategories() {
    return await this.categoryRepository.findAll();
  }

  async getAllCategoriesNames() {
    return await this.categoryRepository.findAll({
      attributes: ['id', 'label'],
    });
  }

  async getOneCategoryById(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Категория с ID ${id} не найдена`);
    }
    return category;
  }

  async updateCategoryById(id: number, newData: Partial<CreateCategoryDto>) {
    const category = await this.getOneCategoryById(id);

    const updateDto = Object.assign(new CreateCategoryDto(), newData);

    const errors = await validate(updateDto);
    if (errors.length > 0) {
      const errorMessage = errors
        .map((error) => Object.values(error.constraints))
        .join(', ');
      throw new BadRequestException(errorMessage);
    }

    await category.update(newData);

    return category;
  }

  async deleteCategoryById(id: number) {
    await this.categoryRepository.destroy({ where: { id } });
    return 'Удалено';
  }

  async updateCategoryImage(id: number, file: Express.Multer.File) {
    const category = await this.getOneCategoryById(id);
    const path = await this.fileService.changeImage(file, category.image);
    console.log('updating image in category');
    category.image = path || null;
    await category.save();
    return category;
  }

  async deleteCategoryImage(id: number) {
    const category = await this.getOneCategoryById(id);
    this.fileService.removeFile(category.image);
    console.log('deleting image in category');
    category.image = null;
    await category.save();
    return category;
  }
}
