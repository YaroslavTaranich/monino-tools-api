import { BadRequestException } from '@nestjs/common';
import { ToolService } from './tool.service';

describe('ToolService type compatibility', () => {
  const toolRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  };
  const toolTypeRepository = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const fileService = {};
  const service = new ToolService(
    toolRepository as never,
    toolTypeRepository as never,
    fileService as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('uses tool_type_id as the source of truth and preserves the legacy field', async () => {
    toolTypeRepository.findByPk.mockResolvedValue({ id: 7, name: 'Дрели' });
    toolRepository.create.mockResolvedValue({ id: 42 });
    toolRepository.findOne.mockResolvedValue({
      id: 42,
      tool_type_id: 7,
      tool_type: 'Дрели',
      toolType: { id: 7, name: 'Дрели' },
    });

    const result = await service.createTool({ tool_type_id: 7 } as never);

    expect(toolRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tool_type_id: 7, tool_type: 'Дрели' }),
    );
    expect(result.tool_type).toBe('Дрели');
  });

  it('maps a legacy string to an existing type', async () => {
    toolTypeRepository.findOne.mockResolvedValue({ id: 3, name: 'Пилы' });
    toolRepository.create.mockResolvedValue({ id: 11 });
    toolRepository.findOne.mockResolvedValue({ id: 11 });

    await service.createTool({ tool_type: ' Пилы ' } as never);

    expect(toolTypeRepository.findOne).toHaveBeenCalledWith({
      where: { name: 'Пилы' },
    });
    expect(toolRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tool_type_id: 3, tool_type: 'Пилы' }),
    );
  });

  it('rejects a request without either type representation', async () => {
    await expect(service.createTool({} as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
