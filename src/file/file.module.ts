import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from 'src/category/category.model';

@Module({
  imports: [SequelizeModule.forFeature([Category])],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
