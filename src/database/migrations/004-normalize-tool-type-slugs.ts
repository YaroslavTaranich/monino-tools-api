import { QueryTypes } from 'sequelize';
import { Migration } from './types';

const transliteration: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export const toToolTypeSlug = (value: string) =>
  Array.from(value.toLowerCase())
    .map((character) => transliteration[character] ?? character)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface ToolTypeRow {
  id: number;
  name: string;
}

export const normalizeToolTypeSlugs: Migration = {
  name: '004-normalize-tool-type-slugs',

  async up({ sequelize, transaction }) {
    const toolTypes = await sequelize.query<ToolTypeRow>(
      'SELECT "id", "name" FROM "tool_types" ORDER BY "id"',
      { type: QueryTypes.SELECT, transaction },
    );
    const usedSlugs = new Set<string>();

    for (const toolType of toolTypes) {
      await sequelize.query(
        'UPDATE "tool_types" SET "slug" = :slug WHERE "id" = :id',
        {
          replacements: {
            id: toolType.id,
            slug: `migration-004-${toolType.id}`,
          },
          transaction,
        },
      );
    }

    for (const toolType of toolTypes) {
      const baseSlug = toToolTypeSlug(toolType.name) || `type-${toolType.id}`;
      let slug = baseSlug;
      if (usedSlugs.has(slug)) slug = `${baseSlug}-${toolType.id}`;
      usedSlugs.add(slug);

      await sequelize.query(
        `UPDATE "tool_types"
         SET "slug" = :slug, "updatedAt" = NOW()
         WHERE "id" = :id`,
        {
          replacements: { id: toolType.id, slug },
          transaction,
        },
      );
    }
  },

  async down() {
    throw new Error(
      'The previous generated tool type slugs cannot be restored automatically.',
    );
  },
};
