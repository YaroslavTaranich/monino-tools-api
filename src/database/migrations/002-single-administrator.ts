import { QueryTypes } from 'sequelize';
import { Migration } from './types';

export const singleAdministrator: Migration = {
  name: '002-single-administrator',

  async up({ sequelize, transaction }) {
    const [{ count }] = await sequelize.query<{ count: string }>(
      `SELECT COUNT(*)::text AS "count" FROM "user" WHERE "role" = 'admin'`,
      { type: QueryTypes.SELECT, transaction },
    );
    if (Number(count) !== 1) {
      throw new Error(
        `Expected exactly one administrator before migration, found ${count}`,
      );
    }

    await sequelize.query(
      `
        DELETE FROM "user" WHERE "role" IS DISTINCT FROM 'admin';
        ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
        ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL;
        ALTER TABLE "user"
          ADD CONSTRAINT "user_single_admin_role" CHECK ("role" = 'admin');
      `,
      { transaction },
    );
  },

  async down() {
    throw new Error(
      'The single-administrator migration cannot restore deleted user records automatically.',
    );
  },
};
