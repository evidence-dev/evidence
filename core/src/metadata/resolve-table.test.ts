import { describe, it, expect } from 'vitest';
import { resolveCatalogTable } from './resolve-table';
import type { Metadata } from './Metadata.svelte';

// A catalog keyed like Snowflake (schema-qualified, upper-cased), with case-folding `getTable`.
const snowflakeCatalog = (names: string[]): Pick<Metadata, 'getTable' | 'tables'> =>
	({
		tables: names.map((name) => ({ name })),
		getTable: (n: string) =>
			names.find((t) => t === n || t.toUpperCase() === n.toUpperCase())
				? ({ name: n } as unknown)
				: undefined
	}) as unknown as Pick<Metadata, 'getTable' | 'tables'>;

describe('resolveCatalogTable', () => {
	const catalog = snowflakeCatalog(['PUBLIC.PARTNERS', 'PUBLIC.ORDERS']);

	it('resolves an exact schema-qualified name', () => {
		expect(resolveCatalogTable(catalog, 'PUBLIC.PARTNERS')).toBeDefined();
	});

	it('resolves a schema-qualified name in any case (Snowflake folds identifiers)', () => {
		expect(resolveCatalogTable(catalog, 'public.partners')).toBeDefined();
	});

	it('resolves a bare, lowercase name against a schema-qualified catalog entry', () => {
		// The reported table_filter bug: `partners` must find `PUBLIC.PARTNERS`.
		expect(resolveCatalogTable(catalog, 'partners')).toBeDefined();
		expect(resolveCatalogTable(catalog, 'PARTNERS')).toBeDefined();
	});

	it('returns undefined for a table that genuinely is not in the catalog', () => {
		expect(resolveCatalogTable(catalog, 'ghost')).toBeUndefined();
		expect(resolveCatalogTable(catalog, 'public.ghost')).toBeUndefined();
	});
});
