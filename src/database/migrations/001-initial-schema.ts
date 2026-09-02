import { Migration } from './types';

export const initialSchema: Migration = {
  name: '001-initial-schema',

  async up({ sequelize, transaction }) {
    await sequelize.query(
      `
        CREATE TABLE IF NOT EXISTS "categories" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL UNIQUE,
          "label" VARCHAR(255) NOT NULL UNIQUE,
          "title" VARCHAR(255) NOT NULL UNIQUE,
          "description" TEXT NOT NULL,
          "html_title" VARCHAR(255) NOT NULL,
          "html_description" VARCHAR(255) NOT NULL,
          "image" VARCHAR(255),
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "user" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL UNIQUE,
          "role" VARCHAR(255),
          "first_name" VARCHAR(255),
          "last_name" VARCHAR(255),
          "password" VARCHAR(255),
          "email" VARCHAR(255),
          "phone" VARCHAR(255),
          "avatar" VARCHAR(255),
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "tools" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL UNIQUE,
          "label" VARCHAR(255) NOT NULL UNIQUE,
          "title" VARCHAR(255) NOT NULL UNIQUE,
          "description" TEXT NOT NULL,
          "specification" TEXT NOT NULL,
          "html_title" VARCHAR(255) NOT NULL,
          "html_description" VARCHAR(255) NOT NULL,
          "image" VARCHAR(255),
          "price" INTEGER NOT NULL,
          "zalog" INTEGER NOT NULL,
          "tool_type" VARCHAR(255) NOT NULL,
          "popular" BOOLEAN,
          "categoryId" INTEGER REFERENCES "categories" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `,
      { transaction },
    );
  },

  async down() {
    throw new Error(
      'The baseline migration cannot be reverted automatically because it may contain production data.',
    );
  },
};
