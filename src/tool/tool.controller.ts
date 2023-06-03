import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ToolService } from './tool.service';
import { CreateToolDto } from './dto/create-tool.dto';

@Controller('tool')
export class ToolController {
  constructor(private toolService: ToolService) {}

  @Post()
  create(@Body() createToolDto: CreateToolDto) {
    return this.toolService.createTool(createToolDto);
  }

  @Get()
  getAll() {
    return this.toolService.getAllTools();
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.toolService.getOneToolById(id);
  }

  @Put(':id')
  updateOne(@Param('id') id: number, @Body() body: CreateToolDto) {
    return this.toolService.updatetoolById(id, body);
  }

  @Delete(':id')
  removeOne(@Param('id') id: number) {
    return this.toolService.deleteToolById(id);
  }
}
