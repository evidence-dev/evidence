import type { Metadata } from './Metadata.svelte';

type CatalogTable = ReturnType<Metadata['getTable']>;

/**
 * Resolve a possibly-bare, differently-cased table name against a warehouse catalog the way the rest
 * of the app does: exact / case-folded first (`Metadata.getTable`), then a `<schema>.<table>` suffix
 * match so a bare `partners` finds `PUBLIC.PARTNERS` on Snowflake. Components that read the catalog
 * directly (e.g. `table_filter`, which needs the column list up front) must resolve like this —
 * otherwise a lowercase/unqualified name that renders fine in a chart shows "No columns found".
 */
export function resolveCatalogTable(
	metadata: Pick<Metadata, 'getTable' | 'tables'>,
	name: string
): CatalogTable {
	const direct = metadata.getTable(name);
	if (direct) return direct;
	if (!name.includes('.')) {
		const suffix = `.${name.toLowerCase()}`;
		for (const table of metadata.tables) {
			if (table.name.toLowerCase().endsWith(suffix)) return table;
		}
	}
	return undefined;
}
