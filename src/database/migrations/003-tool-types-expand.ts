import { Migration } from './types';

export const toolTypesExpand: Migration = {
  name: '003-tool-types-expand',

  async up({ sequelize, transaction }) {
    await sequelize.query(
      `
        CREATE TABLE "tool_types" (
          "id" SERIAL PRIMARY KEY,
          "slug" VARCHAR(255) NOT NULL UNIQUE,
          "name" VARCHAR(255) NOT NULL UNIQUE,
          "sort_order" INTEGER NOT NULL DEFAULT 0,
          "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE "tools" ADD COLUMN "tool_type_id" INTEGER;

        INSERT INTO "tool_types" (
          "slug",
          "name",
          "sort_order",
          "is_active",
          "createdAt",
          "updatedAt"
        )
        SELECT
          CASE
            WHEN trim(both '-' from regexp_replace(lower("tool_type"), '[^a-z0-9]+', '-', 'g')) <> ''
              THEN trim(both '-' from regexp_replace(lower("tool_type"), '[^a-z0-9]+', '-', 'g'))
                   || '-' || substr(md5("tool_type"), 1, 8)
            ELSE 'type-' || substr(md5("tool_type"), 1, 12)
          END,
          "tool_type",
          row_number() OVER (ORDER BY "tool_type") - 1,
          TRUE,
          NOW(),
          NOW()
        FROM (SELECT DISTINCT "tool_type" FROM "tools") AS legacy_types;

        UPDATE "tools" AS tool
        SET "tool_type_id" = tool_type."id"
        FROM "tool_types" AS tool_type
        WHERE tool."tool_type" = tool_type."name";

        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM "tools" WHERE "tool_type_id" IS NULL) THEN
            RAISE EXCEPTION 'Some tools could not be linked to tool_types';
          END IF;
        END
        $$;

        CREATE INDEX "tools_tool_type_id_idx" ON "tools" ("tool_type_id");
        ALTER TABLE "tools"
          ADD CONSTRAINT "tools_tool_type_id_fkey"
          FOREIGN KEY ("tool_type_id") REFERENCES "tool_types" ("id")
          ON UPDATE CASCADE ON DELETE RESTRICT;
      `,
      { transaction },
    );
  },

  async down() {
    throw new Error(
      'The tool-types expansion migration cannot be reverted automatically after production data starts using it.',
    );
  },
};
