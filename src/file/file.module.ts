import { Module } from '@nestjs/common';
import { FileService } from './file.servise';

@Module({
  providers: [FileService],
})
export class FileModule {}
