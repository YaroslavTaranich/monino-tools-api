import { validate } from 'class-validator';
import { CreateToolDto } from './create-tool.dto';

describe('accessory input validation', () => {
  const valid = {
    name: 'test-tool',
    label: 'Test tool',
    title: 'Test title',
    description: 'Test description',
    specification: 'Test specification',
    html_title: 'Test title',
    html_description: 'Test description',
    tool_type_id: 1,
  };
  it.each(
    [
      [1, 1],
      [0],
      [-1],
      ['1'],
      [1.5],
      '1',
      Array.from({ length: 101 }, (_, i) => i + 1),
    ].map((ids) => [ids]),
  )('rejects invalid relationship IDs: %j', async (ids) => {
    const dto = Object.assign(new CreateToolDto(), valid, {
      related_tool_ids: ids,
    });
    expect(
      (await validate(dto)).some(
        (error) => error.property === 'related_tool_ids',
      ),
    ).toBe(true);
  });
  it('keeps legacy requests valid and rejects non-boolean rental restrictions', async () => {
    expect(await validate(Object.assign(new CreateToolDto(), valid))).toEqual(
      [],
    );
    const errors = await validate(
      Object.assign(new CreateToolDto(), valid, { accessory_only: 'false' }),
    );
    expect(errors.some((error) => error.property === 'accessory_only')).toBe(
      true,
    );
  });
});
