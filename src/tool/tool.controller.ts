import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ToolService } from './tool.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { Public } from 'src/decorators/Public';

@Controller('tools')
export class ToolController {
  constructor(private toolService: ToolService) {}

  @Post()
  create(@Body() createToolDto: CreateToolDto) {
    return this.toolService.createTool(createToolDto);
  }

  @Public()
  @Get()
  getAll(@Query() query: { categoryId: number }) {
    if (!!query.categoryId) {
      return this.toolService.getAllToolsByCategoryId(query.categoryId);
    }
    return this.toolService.getAllTools();
  }

  @Public()
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
