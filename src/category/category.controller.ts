import {
  Controller,
  Post,
  Get,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Public } from 'src/decorators/Public';

@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  create(@Body() categoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(categoryDto);
  }

  @Public()
  @Get()
  getAll() {
    return this.categoryService.getAllCategories();
  }

  @Public()
  @Get('names')
  getAllNames() {
    return this.categoryService.getAllCategoriesNames();
  }

  @Public()
  @Get(':id')
  getOneById(@Param('id') id: number) {
    return this.categoryService.getOneCategoryById(id);
  }

  @Put(':id')
  updateOneById(@Param('id') id: number, @Body() newData: CreateCategoryDto) {
    return this.categoryService.updateCategoryById(id, newData);
  }

  @Delete(':id')
  deleteOneById(@Param('id') id: number) {
    return this.categoryService.deleteCategoryById(id);
  }
}
