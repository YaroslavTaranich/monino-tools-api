import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ToolService } from './tool.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { Public } from 'src/decorators/Public';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType } from '../file/file.service';
import { imageParseFilePipe } from '../file/file.controller';

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
    return this.toolService.updateToolById(id, body);
  }

  @Delete(':id')
  removeOne(@Param('id') id: number) {
    return this.toolService.deleteToolById(id);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor(FileType.IMAGE))
  async updateImageById(
    @UploadedFile(imageParseFilePipe)
    file: Express.Multer.File,
    @Param('id') id: number,
  ) {
    return this.toolService.updateToolImage(id, file);
  }
}
