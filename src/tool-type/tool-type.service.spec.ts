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
  };
  const toolRepository = {
    update: jest.fn(),
    count: jest.fn(),
  };
  const sequelize = {
    transaction: jest.fn(async (callback) => callback({ id: 'transaction' })),
  };
  const service = new ToolTypeService(
    toolTypeRepository as never,
    toolRepository as never,
    sequelize as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    toolType.name = 'Старое имя';
    toolTypeRepository.findByPk.mockResolvedValue(toolType);
  });

  it('updates the legacy string on linked tools when a type is renamed', async () => {
    await service.update(5, {
      name: 'Новое имя',
      slug: 'novoe-imya',
      sort_order: 1,
      is_active: true,
    });

    expect(toolRepository.update).toHaveBeenCalledWith(
      { tool_type: 'Новое имя' },
      expect.objectContaining({ where: { tool_type_id: 5 } }),
    );
  });

  it('does not delete a type used by tools', async () => {
    toolRepository.count.mockResolvedValue(2);

    await expect(service.delete(5)).rejects.toBeInstanceOf(ConflictException);
    expect(toolType.destroy).not.toHaveBeenCalled();
  });
});
