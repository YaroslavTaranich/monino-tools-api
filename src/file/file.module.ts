import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from '../category/category.model';
import { Tool } from '../tool/tool.model';
import { ToolImage } from '../tool/tool-image.model';
import { ImageCleanupService } from './image-cleanup.service';

@Module({
  imports: [SequelizeModule.forFeature([Category, Tool, ToolImage])],
  providers: [FileService, ImageCleanupService],
  controllers: [FileController],
  exports: [FileService, ImageCleanupService],
})
export class FileModule {}
