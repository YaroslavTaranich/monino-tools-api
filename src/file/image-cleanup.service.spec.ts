import { ImageCleanupService } from './image-cleanup.service';

describe('ImageCleanupService', () => {
  it('protects category and gallery image references', async () => {
    const categoryRepository = {
      findAll: jest.fn().mockResolvedValue([{ image: 'image/category.jpg' }]),
    };
    const toolImageRepository = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ storage_key: 'image/gallery.webp' }]),
    };
    const fileService = {
      cleanupOrphanedImages: jest.fn().mockReturnValue({ orphaned: [] }),
    };
    const service = new ImageCleanupService(
      categoryRepository as never,
      toolImageRepository as never,
      fileService as never,
    );
    const options = { deleteFiles: true, minAgeMs: 1000 };

    await service.cleanup(options);

    const references = fileService.cleanupOrphanedImages.mock.calls[0][0];
    expect(references).toEqual(
      new Set(['image/category.jpg', 'image/gallery.webp']),
    );
    expect(fileService.cleanupOrphanedImages).toHaveBeenCalledWith(
      references,
      options,
    );
  });
});
