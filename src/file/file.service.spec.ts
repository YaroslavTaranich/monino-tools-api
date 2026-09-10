import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import sharp = require('sharp');
import { FileService } from './file.service';

describe('FileService gallery images', () => {
  let directory: string;
  let service: FileService;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-images-'));
    service = new FileService();
    Object.defineProperty(service, 'staticPath', { value: directory });
  });

  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  it('normalizes a supported image to WebP', async () => {
    const input = await sharp({
      create: {
        width: 20,
        height: 10,
        channels: 3,
        background: '#ff0000',
      },
    })
      .png()
      .toBuffer();

    const stored = await service.storeImage({ buffer: input } as never);
    const output = fs.readFileSync(path.resolve(directory, stored.storage_key));
    const metadata = await sharp(output).metadata();

    expect(stored).toEqual(
      expect.objectContaining({ mime_type: 'image/webp', size: output.length }),
    );
    expect(metadata.format).toBe('webp');
  });

  it('rejects a file whose contents are not an image', async () => {
    await expect(
      service.storeImage({ buffer: Buffer.from('not an image') } as never),
    ).rejects.toThrow('Поддерживаются изображения JPEG, PNG и WebP');
  });

  it('does not allow file paths outside the storage directory', () => {
    expect(() => service.removeFile('../../outside')).toThrow(
      'Неверный путь к файлу',
    );
  });

  it('only removes old image files without database references', () => {
    const imageDirectory = path.resolve(directory, 'image');
    fs.mkdirSync(imageDirectory);
    const now = Date.now();
    const oldDate = new Date(now - 48 * 60 * 60 * 1000);
    for (const fileName of ['referenced.webp', 'orphan.webp', 'fresh.webp']) {
      fs.writeFileSync(path.resolve(imageDirectory, fileName), fileName);
    }
    fs.utimesSync(
      path.resolve(imageDirectory, 'referenced.webp'),
      oldDate,
      oldDate,
    );
    fs.utimesSync(
      path.resolve(imageDirectory, 'orphan.webp'),
      oldDate,
      oldDate,
    );

    const preview = service.cleanupOrphanedImages(
      new Set(['image/referenced.webp']),
      { deleteFiles: false, minAgeMs: 24 * 60 * 60 * 1000, now },
    );
    expect(preview).toEqual({
      scanned: 3,
      referenced: 1,
      retainedByGracePeriod: 1,
      orphaned: ['image/orphan.webp'],
      deleted: 0,
    });
    expect(fs.existsSync(path.resolve(imageDirectory, 'orphan.webp'))).toBe(
      true,
    );

    const cleanup = service.cleanupOrphanedImages(
      new Set(['image/referenced.webp']),
      { deleteFiles: true, minAgeMs: 24 * 60 * 60 * 1000, now },
    );
    expect(cleanup.deleted).toBe(1);
    expect(fs.existsSync(path.resolve(imageDirectory, 'referenced.webp'))).toBe(
      true,
    );
    expect(fs.existsSync(path.resolve(imageDirectory, 'fresh.webp'))).toBe(
      true,
    );
    expect(fs.existsSync(path.resolve(imageDirectory, 'orphan.webp'))).toBe(
      false,
    );
  });
});
