import { initialSchema } from './001-initial-schema';
import { singleAdministrator } from './002-single-administrator';
import { toolTypesExpand } from './003-tool-types-expand';
import { normalizeToolTypeSlugs } from './004-normalize-tool-type-slugs';
import { relaxLegacyToolType } from './005-relax-legacy-tool-type';
import { Migration } from './types';

export const migrations: Migration[] = [
  initialSchema,
  singleAdministrator,
  toolTypesExpand,
  normalizeToolTypeSlugs,
  relaxLegacyToolType,
];
