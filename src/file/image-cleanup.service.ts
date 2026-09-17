import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from '../category/category.model';
import { ToolImage } from '../tool/tool-image.model';
import { FileService, ImageCleanupResult } from './file.service';

interface CleanupOptions {
  deleteFiles: boolean;
  minAgeMs: number;
}

@Injectable()
export class ImageCleanupService {
  constructor(
    @InjectModel(Category) private categoryRepository: typeof Category,
    @InjectModel(ToolImage) private toolImageRepository: typeof ToolImage,
    private readonly fileService: FileService,
  ) {}

  async cleanup(options: CleanupOptions): Promise<ImageCleanupResult> {
    const [categories, toolImages] = await Promise.all([
      this.categoryRepository.findAll({ attributes: ['image'] }),
      this.toolImageRepository.findAll({ attributes: ['storage_key'] }),
    ]);
    const referencedStorageKeys = new Set(
      [
        ...categories.map((category) => category.image),
        ...toolImages.map((image) => image.storage_key),
      ].filter(Boolean),
    );

    return this.fileService.cleanupOrphanedImages(
      referencedStorageKeys,
      options,
    );
  }
}
