import { ConflictException } from '@nestjs/common';
import { ToolTypeService } from './tool-type.service';

describe('ToolTypeService', () => {
  const toolType = {
    id: 5,
    name: 'Старое имя',
    update: jest.fn(async function (data) {
      Object.assign(this, data);
      return this;
    }),
    destroy: jest.fn(),
  };
  const toolTypeRepository = {
    findByPk: jest.fn(),
    create: jest.fn(),
  };
  const toolRepository = { count: jest.fn() };
  const service = new ToolTypeService(
    toolTypeRepository as never,
    toolRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    toolType.name = 'Старое имя';
    toolTypeRepository.findByPk.mockResolvedValue(toolType);
  });

  it('updates a type without changing linked tools', async () => {
    const result = await service.update(5, {
      name: 'Новое имя',
      slug: 'novoe-imya',
      sort_order: 1,
      is_active: true,
    });

    expect(toolType.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Новое имя' }),
    );
    expect(result.name).toBe('Новое имя');
  });

  it('does not delete a type used by tools', async () => {
    toolRepository.count.mockResolvedValue(2);

    await expect(service.delete(5)).rejects.toBeInstanceOf(ConflictException);
    expect(toolType.destroy).not.toHaveBeenCalled();
  });

  it('returns a Russian error for a duplicate name', async () => {
    toolTypeRepository.create.mockRejectedValue({
      name: 'SequelizeUniqueConstraintError',
      errors: [{ path: 'name' }],
    });

    await expect(
      service.create({
        name: 'Дубликат',
        slug: 'duplicate',
        sort_order: 1,
        is_active: true,
      }),
    ).rejects.toThrow('Тип с таким названием уже существует');
  });

  it('does not expose an unexpected database error', async () => {
    toolTypeRepository.create.mockRejectedValue(
      new Error('duplicate key value violates unique constraint'),
    );

    await expect(
      service.create({
        name: 'Новый тип',
        slug: 'new-type',
        sort_order: 1,
        is_active: true,
      }),
    ).rejects.toThrow('Не удалось сохранить тип инструмента');
  });
});
