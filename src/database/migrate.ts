import { QueryTypes, Sequelize } from 'sequelize';
import { migrations } from './migrations';

const tableName = 'SequelizeMeta';

function createSequelize() {
  return new Sequelize({
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    logging: false,
  });
}

async function main() {
  const command = process.argv[2] || 'up';
  const sequelize = createSequelize();

  try {
    await sequelize.authenticate();
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tableName}" ("name" VARCHAR(255) PRIMARY KEY NOT NULL)`,
    );
    const rows = await sequelize.query<{ name: string }>(
      `SELECT "name" FROM "${tableName}" ORDER BY "name"`,
      { type: QueryTypes.SELECT },
    );
    const applied = new Set(rows.map(({ name }) => name));

    if (command === 'status') {
      for (const migration of migrations) {
        console.log(`${applied.has(migration.name) ? 'up' : 'down'} ${migration.name}`);
      }
      return;
    }

    if (command === 'up') {
      for (const migration of migrations.filter(({ name }) => !applied.has(name))) {
        await sequelize.transaction(async (transaction) => {
          await migration.up({ sequelize, transaction });
          await sequelize.query(
            `INSERT INTO "${tableName}" ("name") VALUES (:name)`,
            { replacements: { name: migration.name }, transaction },
          );
        });
        console.log(`Migrated up: ${migration.name}`);
      }
      return;
    }

    if (command === 'down') {
      const migration = [...migrations]
        .reverse()
        .find(({ name }) => applied.has(name));
      if (!migration) {
        console.log('No applied migrations.');
        return;
      }
      await sequelize.transaction(async (transaction) => {
        await migration.down({ sequelize, transaction });
        await sequelize.query(
          `DELETE FROM "${tableName}" WHERE "name" = :name`,
          { replacements: { name: migration.name }, transaction },
        );
      });
      console.log(`Migrated down: ${migration.name}`);
      return;
    }

    throw new Error(`Unknown migration command: ${command}`);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
