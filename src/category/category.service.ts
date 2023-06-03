import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from './category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { validate } from 'class-validator';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category) private categoryRepository: typeof Category,
  ) {}
  async createCategory(dto: CreateCategoryDto) {
    try {
      const category = await this.categoryRepository.create(dto);
      return category;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllCategories() {
    const categories = await this.categoryRepository.findAll();
    return categories;
  }

  async getOneCategoryById(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Категория с ID ${id} не найдена`);
    }
    return category;
  }

  async updateCategoryById(id: number, newData: CreateCategoryDto) {
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
}
