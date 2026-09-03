import { Migration } from './types';

export const relaxLegacyToolType: Migration = {
  name: '005-relax-legacy-tool-type',

  async up({ sequelize, transaction }) {
    await sequelize.query(
      'ALTER TABLE "tools" ALTER COLUMN "tool_type" DROP NOT NULL',
      { transaction },
    );
  },

  async down({ sequelize, transaction }) {
    await sequelize.query(
      `
        UPDATE "tools" AS tool
        SET "tool_type" = tool_type."name"
        FROM "tool_types" AS tool_type
        WHERE tool."tool_type_id" = tool_type."id"
          AND tool."tool_type" IS NULL;

        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM "tools" WHERE "tool_type" IS NULL) THEN
            RAISE EXCEPTION 'Some tools could not restore the legacy tool_type';
          END IF;
        END
        $$;

        ALTER TABLE "tools" ALTER COLUMN "tool_type" SET NOT NULL;
      `,
      { transaction },
    );
  },
};
