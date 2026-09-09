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
import sharp = require('sharp');

export enum FileType {
  IMAGE = 'image',
}

export interface StoredImage {
  storage_key: string;
  mime_type: string;
  size: number;
}

const imageFormats = new Set(['jpeg', 'png', 'webp']);
const maxImageDimension = 8000;
const outputImageDimension = 2000;

@Injectable()
export class FileService {
  private readonly staticPath = path.resolve(__dirname, '..', '..', 'static');

  private resolveStaticPath(filePath: string) {
    const resolved = path.resolve(this.staticPath, filePath);
    if (
      resolved !== this.staticPath &&
      !resolved.startsWith(`${this.staticPath}${path.sep}`)
    ) {
      throw new BadRequestException('Неверный путь к файлу');
    }
    return resolved;
  }

  createFile(type: FileType, file: Express.Multer.File): string {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = uuid.v4() + '.' + fileExtension;
      const filePath = this.resolveStaticPath(type);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }
      fs.writeFileSync(path.resolve(filePath, fileName), file.buffer);
      return type + '/' + fileName;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async storeImage(file: Express.Multer.File): Promise<StoredImage> {
    try {
      const source = sharp(file.buffer, { animated: false });
      const metadata = await source.metadata();
      if (
        !metadata.format ||
        !imageFormats.has(metadata.format) ||
        !metadata.width ||
        !metadata.height ||
        metadata.width > maxImageDimension ||
        metadata.height > maxImageDimension ||
        (metadata.pages ?? 1) > 1
      ) {
        throw new Error('Unsupported image');
      }

      const buffer = await source
        .rotate()
        .resize({
          width: outputImageDimension,
          height: outputImageDimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
      const fileName = `${uuid.v4()}.webp`;
      const directory = this.resolveStaticPath(FileType.IMAGE);
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.resolve(directory, fileName), buffer);

      return {
        storage_key: `${FileType.IMAGE}/${fileName}`,
        mime_type: 'image/webp',
        size: buffer.length,
      };
    } catch (error) {
      throw new BadRequestException(
        'Поддерживаются изображения JPEG, PNG и WebP размером до 8000×8000 пикселей',
      );
    }
  }

  removeFile(fileName: string) {
    if (!fileName) return { message: 'Файла не существует' };
    const filePath = this.resolveStaticPath(fileName);

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
    const fullPath = this.resolveStaticPath(filePath);
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
    const filesPath = this.resolveStaticPath(type);
    const fileNames = fs.readdirSync(filesPath);

    return { fileNames };
  }

  async changeImage(file: Express.Multer.File, oldPath: string) {
    try {
      const newPath = this.createFile(FileType.IMAGE, file);
      if (oldPath) this.removeFile(oldPath);
      return newPath;
    } catch (error) {
      throw new BadRequestException('Неверный формат файла');
    }
  }
}
