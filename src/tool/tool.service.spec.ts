import { BadRequestException } from '@nestjs/common';
import { ToolService } from './tool.service';

describe('ToolService tool types', () => {
  const toolRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  };
  const toolTypeRepository = {
    findByPk: jest.fn(),
  };
  const fileService = {};
  const service = new ToolService(
    toolRepository as never,
    toolTypeRepository as never,
    fileService as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('uses tool_type_id as the only type field', async () => {
    toolTypeRepository.findByPk.mockResolvedValue({ id: 7, name: 'Дрели' });
    toolRepository.create.mockResolvedValue({ id: 42 });
    toolRepository.findOne.mockResolvedValue({
      id: 42,
      tool_type_id: 7,
      toolType: { id: 7, name: 'Дрели' },
    });

    const result = await service.createTool({ tool_type_id: 7 } as never);

    const createPayload = toolRepository.create.mock.calls[0][0];
    expect(createPayload).toEqual(expect.objectContaining({ tool_type_id: 7 }));
    expect(createPayload).not.toHaveProperty('tool_type');
    expect(result.tool_type_id).toBe(7);
  });

  it('rejects a request without a type ID', async () => {
    await expect(service.createTool({} as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an unknown type ID', async () => {
    toolTypeRepository.findByPk.mockResolvedValue(null);

    await expect(
      service.createTool({ tool_type_id: 999 } as never),
    ).rejects.toThrow('Тип инструмента с ID 999 не найден');
  });
});
