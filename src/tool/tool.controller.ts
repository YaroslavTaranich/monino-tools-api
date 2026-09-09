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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ToolService } from './tool.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { Public } from 'src/decorators/Public';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileType } from '../file/file.service';
import { imageParseFilePipe } from '../file/file.controller';
import { SortToolImagesDto } from './dto/sort-tool-images.dto';

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

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: { fileSize: 5_000_000, files: 5 },
    }),
  )
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id') id: number,
  ) {
    return this.toolService.uploadToolImages(id, files ?? []);
  }

  @Put(':id/images/order')
  sortImages(@Param('id') id: number, @Body() body: SortToolImagesDto) {
    return this.toolService.sortToolImages(id, body.image_ids);
  }

  @Put(':id/images/:imageId/cover')
  setCover(@Param('id') id: number, @Param('imageId') imageId: number) {
    return this.toolService.setToolImageCover(id, imageId);
  }

  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: number, @Param('imageId') imageId: number) {
    return this.toolService.deleteToolImage(id, imageId);
  }
}
