import { getContext, setContext } from 'svelte';
import { Metadata } from './Metadata.svelte';
import { InlineQueries } from '../user-components/common/inline-queries';
import type { IColumnMetadata } from './metadata';
import { TableMetadata } from './TableMetadata.svelte';
import { getClickHouseToJsType } from '../user-components/common/typeConversions';
import type { AnyRowType, QueryService } from '../user-components/interfaces/query-service';
import type { ITableMetadata } from './metadata';
import {
	interpolateQueryStrings,
	hasTemplating,
	extractFilterIds
} from '../interpolate-query-strings';
import type { Filters } from '../Filters.svelte';
import debounce from 'just-debounce-it';
import { logger } from '../shims/logger';

const INLINE_QUERY_METADATA_CONTEXT_KEY = Symbol('INLINE_QUERY_METADATA_CONTEXT');

interface DescribeTableRow extends AnyRowType {
	name: string;
	type: string;
}

type InlineQueryMetadataDependencies = {
	inlineQueries: InlineQueries;
	pageFilters: Filters | undefined;
};

export class InlineQueryMetadata extends Metadata {
	private activeQueries = new Map<string, string>();

	#initialized = $state(false);

	get initialized() {
		return this.#initialized;
	}

	constructor(
		queryService: QueryService,
		private readonly deps: InlineQueryMetadataDependencies
	) {
		super(queryService);
	}

	/**
	 * Override the parent's load() method to prevent loading all database tables.
	 * InlineQueryMetadata should only contain metadata for inline queries,
	 * not all tables from the database.
	 */
	async load(): Promise<void> {
		// Do nothing - inline query metadata is loaded via loadAll() or loadInlineQueryMetadata()
		// This override prevents the parent's load() from being called by the watch in Metadata constructor
	}

	async loadInlineQueryMetadata(queryName: string): Promise<void> {
		const rawQuery = this.deps.inlineQueries.getRaw(queryName);
		if (!rawQuery) return;

		// For templated queries, try to interpolate with filters to get better error handling
		let queryToDescribe = rawQuery;

		if (hasTemplating(rawQuery)) {
			try {
				// Use global filters for interpolation
				const filterContexts = [this.deps.pageFilters].filter((x): x is NonNullable<typeof x> =>
					Boolean(x)
				);
				const result = interpolateQueryStrings(rawQuery, filterContexts, this.deps.inlineQueries);

				if (result.errors.length === 0) {
					// Successfully interpolated, use the result
					queryToDescribe = result.sql;

					// Extract filter IDs referenced in query (using shared utility)
					const filterIds = extractFilterIds(rawQuery);

					if (filterIds.length > 0) {
						// Check if any referenced filters have empty values
						for (const filterId of filterIds) {
							const filter = filterContexts[0]?.get(filterId);
							if (filter) {
								const isEmpty =
									filter.value === undefined ||
									filter.value === '' ||
									(Array.isArray(filter.value) && filter.value.length === 0);

								if (isEmpty) {
									// Filter exists but has no value yet (e.g., select_first still loading)
									// Skip metadata load - will retry when filter gets a value
									return;
								}
							}
						}
					}
				} else {
					// Template errors exist - capture them and don't try to execute the query
					// Create a table with the template errors instead of trying to execute malformed SQL
					this.addTable(queryName, {}, `Template errors: ${result.errors.join(', ')}`);
					this.activeQueries.delete(queryName);
					return;
				}
			} catch (error) {
				// If interpolation fails completely, show a template error
				const errorMessage =
					error instanceof Error ? error.message : 'Template interpolation failed';
				this.addTable(queryName, {}, `Template error: ${errorMessage}`);
				this.activeQueries.delete(queryName);
				return;
			}
		}

		const oldQuery = this.activeQueries.get(queryName);
		if (oldQuery === queryToDescribe && this.getTable(queryName)) {
			return;
		}

		// Clear stale metadata before re-describing so validators don't check
		// columns against an outdated schema while the async DESCRIBE is in flight.
		if (this.getTable(queryName)) {
			this.removeTableMetadata(queryName);
		}

		try {
			const queryService = this.getQueryService();
			const dialectName = queryService.dialect.name;

			let columns: Record<string, IColumnMetadata>;

			if (
				dialectName === 'snowflake' ||
				dialectName === 'bigquery' ||
				dialectName === 'fabric' ||
				dialectName === 'postgres' ||
				dialectName === 'cube' ||
				dialectName === 'motherduck'
			) {
				// Snowflake, BigQuery, Fabric (T-SQL), Postgres, Cube, and MotherDuck (DuckDB)
				// have no DESCRIBE TABLE on a subquery. Run `SELECT * FROM (...) WHERE 1=0`
				// instead — zero rows, but the result metadata still carries the column
				// names and types from the warehouse driver.
				const aliasQuoted = queryService.dialect.quoteAlias('__describe__');
				const result = await queryService.query(
					`SELECT * FROM (${queryToDescribe}) ${aliasQuoted} WHERE 1=0`
				);

				if (result.error) {
					this.addTable(queryName, {}, result.error);
					this.activeQueries.set(queryName, queryToDescribe);
					return;
				}

				columns = (result.columns ?? []).reduce(
					(acc, col) => {
						// QueryResult.columns exposes Column objects with name + jsType + clickhouseType.
						if (typeof col === 'object' && col && 'name' in col) {
							const name = col.name as string;
							const type = 'clickhouseType' in col ? (col.clickhouseType as string) : '';
							const jsType =
								'jsType' in col ? (col.jsType as IColumnMetadata['jsType']) : 'unknown';
							acc[name] = { name, type, jsType };
						}
						return acc;
					},
					{} as Record<string, IColumnMetadata>
				);
			} else {
				const result = await queryService.query<DescribeTableRow>(
					`DESCRIBE TABLE (${queryToDescribe})`
				);

				if (result.error) {
					this.addTable(queryName, {}, result.error);
					this.activeQueries.set(queryName, queryToDescribe);
					return;
				}

				columns = result.rows.reduce(
					(acc, row) => {
						acc[row.name] = {
							name: row.name,
							type: row.type,
							jsType: getClickHouseToJsType(row.type)
						};
						return acc;
					},
					{} as Record<string, IColumnMetadata>
				);
			}

			// Add the virtual table to our tables map
			this.addTable(queryName, columns);
			this.activeQueries.set(queryName, queryToDescribe);
		} catch (err) {
			logger.error(err, `Error loading metadata for inline query ${queryName}`);
		}
	}

	async #loadInlineQueryMetadatas(queryNames: string[]): Promise<void> {
		const currentTables = this.tables || [];
		for (const table of currentTables) {
			if (!queryNames.includes(table.name)) {
				this.removeTableMetadata(table.name);
				this.activeQueries.delete(table.name);
			}
		}

		await Promise.all(queryNames.map((name) => this.loadInlineQueryMetadata(name)));

		this.#initialized = true;
	}

	#loadInlineQueryMetadatasDebounced = debounce((queryNames: string[]) => {
		this.#loadInlineQueryMetadatas(queryNames);
	}, 500);

	// Default to PUBLIC names: this metadata feeds authoring surfaces (table/
	// column autocomplete via `tables`), and component-scoped queries
	// (`<tag>:<name>`) must never be offered to authors. Skipping them also
	// avoids pointless warehouse describes — nothing consumes their metadata.
	loadAll(queryNames: string[] = this.deps.inlineQueries.getPublicNames()): Promise<void> {
		// Track inline query CONTENT as a dependency to ensure this method reacts
		// when a query body changes without the name changing.
		const _ = queryNames.map((name) => this.deps.inlineQueries.getRaw(name));
		return this.#loadInlineQueryMetadatas(queryNames);
	}

	loadAllDebounced(): void {
		const queryNames = this.deps.inlineQueries.getPublicNames();
		// Track inline query CONTENT as a dependency to ensure this method reacts
		// when a query body changes without the name changing.
		const _ = queryNames.map((name) => this.deps.inlineQueries.getRaw(name));
		this.#loadInlineQueryMetadatasDebounced(queryNames);
	}

	/**
	 * Check if a query name refers to a SQL file (as opposed to an inline query block).
	 * Used for autocomplete to determine if bracket wrapping is needed.
	 */
	isSqlFile(name: string): boolean {
		return this.deps.inlineQueries.isSqlFile(name);
	}

	private addTable(name: string, columns: Record<string, IColumnMetadata>, error?: string): void {
		// Errors are no longer cached in activeQueries, so a query whose filter stays
		// missing reaches this on every pass. Re-writing the same error would notify
		// every metadata reader each time, for as long as the filter is absent.
		if (error !== undefined && this.getTable(name)?.error === error) return;

		const tableData: ITableMetadata =
			error !== undefined
				? { name, columns, error, tableType: 'inline_query' }
				: { name, columns, tableType: 'inline_query' };
		const table = new TableMetadata(tableData, {
			caseInsensitive: this.getQueryService().dialect.caseInsensitiveIdentifiers
		});
		this.addTableMetadata(table);
	}
}

export const setInlineQueryMetadataContext = (metadata: InlineQueryMetadata) => {
	setContext(INLINE_QUERY_METADATA_CONTEXT_KEY, metadata);
};

export const getInlineQueryMetadataContext = (): InlineQueryMetadata => {
	const context = getContext<InlineQueryMetadata | undefined>(INLINE_QUERY_METADATA_CONTEXT_KEY);
	if (!context) {
		throw new Error('Inline query metadata context not found');
	}
	return context;
};
