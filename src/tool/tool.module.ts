import { SequelizeModule } from '@nestjs/sequelize';
import { ToolController } from './tool.controller';
import { Tool } from './tool.model';
import { ToolService } from './tool.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [ToolService],
  controllers: [ToolController],
  imports: [SequelizeModule.forFeature([Tool])],
})
export class ToolModule {}
