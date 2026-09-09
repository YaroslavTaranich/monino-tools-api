import { Migration } from './types';

export const toolImages: Migration = {
  name: '008-tool-images',

  async up({ sequelize, transaction }) {
    await sequelize.query(
      `
        CREATE TABLE "tool_images" (
          "id" SERIAL PRIMARY KEY,
          "tool_id" INTEGER NOT NULL REFERENCES "tools" ("id") ON DELETE CASCADE,
          "storage_key" VARCHAR(255) NOT NULL,
          "sort_order" INTEGER NOT NULL DEFAULT 0 CHECK ("sort_order" >= 0),
          "is_cover" BOOLEAN NOT NULL DEFAULT FALSE,
          "alt" VARCHAR(255),
          "mime_type" VARCHAR(100),
          "size" INTEGER CHECK ("size" IS NULL OR "size" >= 0),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX "tool_images_tool_id_sort_order_idx"
          ON "tool_images" ("tool_id", "sort_order", "id");
        CREATE UNIQUE INDEX "tool_images_one_cover_per_tool_idx"
          ON "tool_images" ("tool_id") WHERE "is_cover" = TRUE;

        INSERT INTO "tool_images" (
          "tool_id", "storage_key", "sort_order", "is_cover", "alt"
        )
        SELECT "id", "image", 0, TRUE, "label"
        FROM "tools"
        WHERE "image" IS NOT NULL AND BTRIM("image") <> '';
      `,
      { transaction },
    );
  },

  async down() {
    throw new Error(
      'Restore a backup to remove tool images; automatic rollback would lose gallery data.',
    );
  },
};
