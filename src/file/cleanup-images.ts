import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImageCleanupService } from './image-cleanup.service';

const hourInMilliseconds = 60 * 60 * 1000;

async function cleanupImages() {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter((arg) => arg !== '--delete');
  if (unknownArgs.length) {
    throw new Error(`Неизвестные аргументы: ${unknownArgs.join(', ')}`);
  }

  const deleteFiles = args.includes('--delete');
  const minAgeHours = Number(process.env.IMAGE_CLEANUP_MIN_AGE_HOURS ?? '24');
  if (!Number.isFinite(minAgeHours) || minAgeHours < 0) {
    throw new Error('IMAGE_CLEANUP_MIN_AGE_HOURS должен быть числом от 0');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const result = await app.get(ImageCleanupService).cleanup({
      deleteFiles,
      minAgeMs: minAgeHours * hourInMilliseconds,
    });
    const action = deleteFiles ? 'Удалён' : 'Будет удалён';
    for (const storageKey of result.orphaned) {
      console.log(`${action}: ${storageKey}`);
    }
    console.log(
      [
        `Проверено файлов: ${result.scanned}`,
        `используется: ${result.referenced}`,
        `моложе ${minAgeHours} ч: ${result.retainedByGracePeriod}`,
        `потерянных: ${result.orphaned.length}`,
        `удалено: ${result.deleted}`,
      ].join(', '),
    );
    if (!deleteFiles && result.orphaned.length) {
      console.log('Это просмотр. Для удаления добавьте --delete.');
    }
  } finally {
    await app.close();
  }
}

cleanupImages().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
