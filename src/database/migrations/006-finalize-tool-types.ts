import { Migration } from './types';

export const finalizeToolTypes: Migration = {
  name: '006-finalize-tool-types',

  async up({ sequelize, transaction }) {
    await sequelize.query(
      `
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM "tools" WHERE "tool_type_id" IS NULL) THEN
            RAISE EXCEPTION 'Every tool must reference a tool type';
          END IF;
        END
        $$;

        ALTER TABLE "tools" ALTER COLUMN "tool_type_id" SET NOT NULL;
        ALTER TABLE "tools" DROP COLUMN "tool_type";
      `,
      { transaction },
    );
  },

  async down({ sequelize, transaction }) {
    await sequelize.query(
      `
        ALTER TABLE "tools" ADD COLUMN "tool_type" VARCHAR(255);

        UPDATE "tools" AS tool
        SET "tool_type" = tool_type."name"
        FROM "tool_types" AS tool_type
        WHERE tool."tool_type_id" = tool_type."id";

        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM "tools" WHERE "tool_type" IS NULL) THEN
            RAISE EXCEPTION 'Some tools could not restore the legacy tool_type';
          END IF;
        END
        $$;

        ALTER TABLE "tools" ALTER COLUMN "tool_type" SET NOT NULL;
        ALTER TABLE "tools" ALTER COLUMN "tool_type_id" DROP NOT NULL;
      `,
      { transaction },
    );
  },
};
