import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './category.model';
import { FileModule } from '../file/file.module';

@Module({
  providers: [CategoryService],
  controllers: [CategoryController],
  imports: [SequelizeModule.forFeature([Category]), FileModule],
  exports: [CategoryService],
})
export class CategoryModule {}
