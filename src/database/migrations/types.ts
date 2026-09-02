import { Sequelize, Transaction } from 'sequelize';

export interface MigrationContext {
  sequelize: Sequelize;
  transaction: Transaction;
}

export interface Migration {
  name: string;
  up(context: MigrationContext): Promise<void>;
  down(context: MigrationContext): Promise<void>;
}
