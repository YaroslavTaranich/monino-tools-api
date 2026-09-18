import { removeLegacyToolImage } from './009-remove-legacy-tool-image';

describe('009-remove-legacy-tool-image', () => {
  const transaction = {} as never;

  it('drops the legacy column on migrate up', async () => {
    const sequelize = { query: jest.fn().mockResolvedValue(undefined) };

    await removeLegacyToolImage.up({
      sequelize: sequelize as never,
      transaction,
    });

    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "image"'),
      { transaction },
    );
  });

  it('restores the legacy column from gallery covers on migrate down', async () => {
    const sequelize = { query: jest.fn().mockResolvedValue(undefined) };

    await removeLegacyToolImage.down({
      sequelize: sequelize as never,
      transaction,
    });

    const sql = sequelize.query.mock.calls[0][0];
    expect(sql).toContain('ADD COLUMN "image"');
    expect(sql).toContain('cover."is_cover" = TRUE');
    expect(sequelize.query).toHaveBeenCalledWith(sql, { transaction });
  });
});
