import type { ConfigDrivenSchema, ConfigDrivenTypeDefinition } from '../../common/configDriven/configDrivenTypes';

import type { IndexFieldLike, IndexListLike } from './classicRetrievalTypes';

export const toIndexListLike = (value: unknown): IndexListLike | null => {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  const name = String(rec.Name ?? rec.name ?? '').trim();
  if (!name) return null;
  const description = String(rec.Description ?? rec.description ?? '').trim();
  return { name, description: description || undefined };
};

export const toIndexFieldLike = (value: unknown): IndexFieldLike | null => {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  const name = String(rec.name ?? '').trim();
  const type = String(rec.type ?? '').trim();
  if (!name || !type) return null;
  return {
    name,
    type,
    key: rec.key === true,
    retrievable: rec.retrievable === true,
    searchable: rec.searchable === true,
    filterable: rec.filterable === true,
    sortable: rec.sortable === true,
    facetable: rec.facetable === true,
    dimensions: typeof rec.dimensions === 'number' ? (rec.dimensions as number) : undefined,
    vectorSearchDimensions: typeof rec.vectorSearchDimensions === 'number' ? (rec.vectorSearchDimensions as number) : undefined
  };
};

export const stringifyShort = (v: unknown): string => {
  if (v === null || typeof v === 'undefined') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

export const csvToList = (value: string): string[] =>
  (value || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export const listToCsv = (values: string[]): string =>
  (values || [])
    .map((x) => String(x).trim())
    .filter(Boolean)
    .join(',');

export const formatOrderbySingle = (field: string, dir: 'asc' | 'desc'): string => {
  const f = (field || '').trim();
  if (!f) return '';
  return `${f} ${dir}`;
};

export const parseOrderbySingle = (value: string): { field: string; dir: 'asc' | 'desc' } | null => {
  const raw = (value || '').trim();
  if (!raw) return null;

  // Only supports a single expression. If multiple are present, keep the first for UI sync.
  // Split on commas at top-level (ignore commas inside parentheses).
  let first = '';
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '(') depth++;
    if (ch === ')' && depth > 0) depth--;
    if (ch === ',' && depth === 0) {
      first = raw.slice(0, i).trim();
      break;
    }
  }
  if (!first) first = raw;

  const lower = first.toLowerCase();
  if (lower.endsWith(' asc')) return { field: first.slice(0, -4).trim(), dir: 'asc' };
  if (lower.endsWith(' desc')) return { field: first.slice(0, -5).trim(), dir: 'desc' };

  return { field: first.trim(), dir: 'desc' };
};

export const isVectorField = (f: IndexFieldLike): boolean => {
  const t = (f.type || '').toLowerCase();
  return (
    (t.includes('collection') && t.includes('edm.single')) ||
    typeof f.dimensions === 'number' ||
    typeof f.vectorSearchDimensions === 'number'
  );
};

export const describeField = (f: IndexFieldLike): string => {
  const badges: string[] = [];
  if (f.key) badges.push('key');
  if (f.searchable) badges.push('searchable');
  if (f.filterable) badges.push('filterable');
  if (f.sortable) badges.push('sortable');
  if (f.facetable) badges.push('facetable');
  if (f.retrievable) badges.push('retrievable');
  if (isVectorField(f)) {
    const dims = f.dimensions ?? f.vectorSearchDimensions;
    badges.push(dims ? `vector:${dims}` : 'vector');
  }
  return badges.length > 0 ? badges.join(' • ') : f.type;
};

export const buildVectorQueriesSchema = (vectorQueryConfig: ConfigDrivenSchema): ConfigDrivenSchema => {
  const typeDef: ConfigDrivenTypeDefinition = {
    discriminatorValue: 'VectorQueriesEditor',
    label: 'VectorQueriesEditor',
    description: 'Edit vector query payloads used for vector/hybrid search.',
    fields: [
      {
        key: 'vectorFilterMode',
        label: 'Vector Filter Mode',
        type: 'enum',
        optionsRef: 'Common/Search/enums/VectorFilterMode.json',
        tooltip: 'Whether filters are applied before or after vector search.'
      },
      {
        key: 'vectorQueries',
        label: 'Vector Queries',
        type: 'objectArray',
        orderMatters: true,
        tooltip: 'Vector and hybrid search query parameters.',
        schema: vectorQueryConfig
      }
    ]
  };

  return {
    entity: {
      title: 'Vector Search',
      description: 'Vector/hybrid query options',
      discriminatorKey: '@odata.type',
      nameKey: 'name'
    },
    commonFields: [],
    types: [typeDef]
  };
};
