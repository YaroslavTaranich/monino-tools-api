import { Migration } from './types';

export const removeLegacyToolImage: Migration = {
  name: '009-remove-legacy-tool-image',

  async up({ sequelize, transaction }) {
    await sequelize.query(`ALTER TABLE "tools" DROP COLUMN "image";`, {
      transaction,
    });
  },

  async down({ sequelize, transaction }) {
    await sequelize.query(
      `
        ALTER TABLE "tools" ADD COLUMN "image" VARCHAR(255);

        UPDATE "tools" AS tools
        SET "image" = cover."storage_key"
        FROM "tool_images" AS cover
        WHERE cover."tool_id" = tools."id"
          AND cover."is_cover" = TRUE;
      `,
      { transaction },
    );
  },
};
