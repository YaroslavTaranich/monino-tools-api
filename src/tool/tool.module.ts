import { SequelizeModule } from '@nestjs/sequelize';
import { ToolController } from './tool.controller';
import { Tool } from './tool.model';
import { ToolService } from './tool.service';
import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.module';

@Module({
  providers: [ToolService],
  controllers: [ToolController],
  imports: [SequelizeModule.forFeature([Tool]), FileModule],
})
export class ToolModule {}
