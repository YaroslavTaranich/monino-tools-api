import { Migration } from './types';

export const toolAccessories: Migration = {
  name: '007-tool-accessories',
  async up({ sequelize, transaction }) {
    await sequelize.query(
      `
      ALTER TABLE tools ADD COLUMN accessory_only BOOLEAN NOT NULL DEFAULT FALSE;
      CREATE TABLE tool_accessories (
        tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
        accessory_tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
        tool_sort_order INTEGER NOT NULL DEFAULT 0 CHECK (tool_sort_order >= 0),
        accessory_sort_order INTEGER NOT NULL DEFAULT 0 CHECK (accessory_sort_order >= 0),
        PRIMARY KEY (tool_id, accessory_tool_id),
        CHECK (tool_id < accessory_tool_id)
      );
      CREATE INDEX tool_accessories_reverse_idx ON tool_accessories(accessory_tool_id);
    `,
      { transaction },
    );
  },
  async down() {
    throw new Error(
      'Restore a backup to remove accessories; automatic rollback would lose rental restrictions and links.',
    );
  },
};
