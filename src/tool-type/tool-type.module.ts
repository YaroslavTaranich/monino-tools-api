import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tool } from '../tool/tool.model';
import { ToolTypeController } from './tool-type.controller';
import { ToolType } from './tool-type.model';
import { ToolTypeService } from './tool-type.service';

@Module({
  imports: [SequelizeModule.forFeature([ToolType, Tool])],
  controllers: [ToolTypeController],
  providers: [ToolTypeService],
  exports: [ToolTypeService],
})
export class ToolTypeModule {}
