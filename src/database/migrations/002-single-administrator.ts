import { QueryTypes } from 'sequelize';
import { Migration } from './types';

const primaryAdministratorId = 43;

export const singleAdministrator: Migration = {
  name: '002-single-administrator',

  async up({ sequelize, transaction }) {
    const administrators = await sequelize.query<{ id: number }>(
      `
        SELECT "id"
        FROM "user"
        WHERE "id" = :primaryAdministratorId AND "role" = 'admin'
      `,
      {
        replacements: { primaryAdministratorId },
        type: QueryTypes.SELECT,
        transaction,
      },
    );
    if (administrators.length !== 1) {
      throw new Error(
        `Expected administrator record ${primaryAdministratorId} before migration, found ${administrators.length}`,
      );
    }

    await sequelize.query(
      `
        DELETE FROM "user" WHERE "id" <> :primaryAdministratorId;
        ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
        ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL;
        ALTER TABLE "user"
          ADD CONSTRAINT "user_single_admin_role" CHECK ("role" = 'admin');
      `,
      {
        replacements: { primaryAdministratorId: administrators[0].id },
        transaction,
      },
    );
  },

  async down() {
    throw new Error(
      'The single-administrator migration cannot restore deleted user records automatically.',
    );
  },
};
