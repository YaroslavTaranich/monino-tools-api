import { SequelizeModule } from '@nestjs/sequelize';
import { ToolController } from './tool.controller';
import { Tool } from './tool.model';
import { ToolService } from './tool.service';
import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.module';
import { ToolType } from '../tool-type/tool-type.model';
import { ToolImage } from './tool-image.model';

@Module({
  providers: [ToolService],
  controllers: [ToolController],
  imports: [
    SequelizeModule.forFeature([Tool, ToolType, ToolImage]),
    FileModule,
  ],
})
export class ToolModule {}
