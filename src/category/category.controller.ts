import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Public } from 'src/decorators/Public';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType } from '../file/file.service';
import { imageParseFilePipe } from '../file/file.controller';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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

  @Post(':id/image')
  @UseInterceptors(FileInterceptor(FileType.IMAGE))
  async updateImageById(
    @UploadedFile(imageParseFilePipe)
    file: Express.Multer.File,
    @Param('id') id: number,
  ) {
    return this.categoryService.updateCategoryImage(id, file);
  }

  @Delete(':id/image')
  async deleteImage(@Param('id') id: number) {
    return this.categoryService.deleteCategoryImage(id);
  }
}
