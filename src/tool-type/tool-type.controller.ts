import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Public } from '../decorators/Public';
import { SaveToolTypeDto } from './dto/save-tool-type.dto';
import { ToolTypeService } from './tool-type.service';

@Controller('tool-types')
export class ToolTypeController {
  constructor(private readonly toolTypeService: ToolTypeService) {}

  @Public()
  @Get()
  getAll() {
    return this.toolTypeService.getAll();
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.toolTypeService.getOne(id);
  }

  @Post()
  create(@Body() dto: SaveToolTypeDto) {
    return this.toolTypeService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: SaveToolTypeDto) {
    return this.toolTypeService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.toolTypeService.delete(id);
  }
}
