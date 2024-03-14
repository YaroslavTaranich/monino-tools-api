import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import * as uuid from 'uuid';

export enum FileType {
  IMAGE = 'image',
}

@Injectable()
export class FileService {
  createFile(type: FileType, file: Express.Multer.File): string {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = uuid.v4() + '.' + fileExtension;
      const filePath = path.resolve(__dirname, '..', '..', 'static', type);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }
      fs.writeFileSync(path.resolve(filePath, fileName), file.buffer);
      return type + '/' + fileName;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  removeFile(fileName: string) {
    const filePath = path.resolve(__dirname, '..', 'static', fileName);

    if (!fs.existsSync(filePath)) {
      return { message: 'Файла не существует' };
    }

    try {
      fs.unlinkSync(filePath);
      return { message: 'Файл удалён' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  showFileByPath(filePath: string) {
    const fullPath = path.resolve(__dirname, '..', '..', 'static', filePath);
    if (!fs.existsSync(fullPath)) {
      throw new HttpException('Файла не существует', HttpStatus.NOT_FOUND);
    }
    try {
      const file = createReadStream(fullPath);
      return new StreamableFile(file);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  showAllFiles(type: FileType) {
    const filesPath = path.resolve(__dirname, '..', '..', 'static', type);
    const fileNames = fs.readdirSync(filesPath);

    return { fileNames };
  }

  async changeImage(file: Express.Multer.File, oldPath: string) {
    try {
      if (oldPath) {
        this.removeFile(oldPath);
      }
      return this.createFile(FileType.IMAGE, file);
    } catch (error) {
      throw new BadRequestException('Неверный формат файла');
    }
  }
}
