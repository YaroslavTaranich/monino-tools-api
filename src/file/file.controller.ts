import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService, FileType } from './file.service';
import { Public } from 'src/decorators/Public';

export const imageParseFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 5_000_000 }),
    new FileTypeValidator({ fileType: 'image/jpeg' }),
  ],
});

interface IUpdateImageBody {
  oldPath?: string;
}

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Public()
  @Get('image/:path')
  getImageByPath(@Param('path') path: string): StreamableFile {
    return this.fileService.showFileByPath('image/' + path);
  }

  @Post('update')
  @UseInterceptors(FileInterceptor(FileType.IMAGE))
  async uploadFile(
    @UploadedFile(imageParseFilePipe)
    file: Express.Multer.File,
    @Body() body: IUpdateImageBody,
  ) {
    const path = await this.fileService.changeImage(file, body.oldPath);
    return { path };
  }

  @Post('delete')
  deleteFile(@Body() { path }: { path: string }) {
    return this.fileService.removeFile(path);
  }

  @Public()
  @Get(FileType.IMAGE)
  showAllFilesByType() {
    return this.fileService.showAllFiles(FileType.IMAGE);
  }
}
