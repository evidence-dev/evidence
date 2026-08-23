import type { ProjectTree } from '../interfaces/project-tree';
import type { Filters } from '../../Filters.svelte';
import type { Metadata } from '../../metadata/Metadata.svelte';
import type { InlineQueryMetadata } from '../../metadata/inline-query-metadata.svelte';
import type { InlineQueries } from '../common/inline-queries';
import type { MetricsCatalog } from '../../metrics/metrics-catalog';
import type { UserComponentSchema } from '../types';
import { defaultDialect, type SqlDialect } from '../../sql-dialect';

export type ValidationContext = {
	metadata: Metadata | undefined;
	filters: Filters | undefined;
	inlineQueries: InlineQueries | undefined;
	/** Per-connection catalog resolver for validating a `connection:table` reference against the right warehouse. Absent on single-connection/CLI surfaces (the ambient `metadata` is the only catalog). */
	metadataForConnection?: ((name: string) => Metadata | undefined) | undefined;
	inlineQueryMetadata?: InlineQueryMetadata | undefined;
	trees: ProjectTree[] | undefined;
	dialect?: SqlDialect | undefined;
	/** Project metric catalog; enables edit-time validation of `metric=` references. */
	metricsCatalog?: MetricsCatalog | undefined;
	/**
	 * New project-root model: full project-root-relative path of the page being
	 * rendered (e.g. `pages/reports/q4`). Used to resolve "from here" partial and
	 * query references. Undefined for legacy projects.
	 */
	basePath?: string | undefined;
	/** Opt into the new "from here / from root" reference resolution. */
	useRelativeResolution?: boolean | undefined;
};

export const isValidationContext = (x: unknown): x is ValidationContext =>
	typeof x === 'object' &&
	x !== null &&
	'metadata' in x &&
	(typeof x.metadata === 'undefined' || typeof x.metadata === 'object') &&
	'filters' in x &&
	(typeof x.filters === 'undefined' || typeof x.filters === 'object') &&
	'inlineQueries' in x &&
	(typeof x.inlineQueries === 'undefined' || typeof x.inlineQueries === 'object');

export type Validator = NonNullable<UserComponentSchema['validate']>;

/** Metadata's dialect wins; the default is only for legacy dialect-less callers. */
export const resolveDialect = (context: ValidationContext): SqlDialect =>
	context.metadata?.dialect ?? context.dialect ?? defaultDialect;

/**
 * Helper function to get a table from either regular metadata or inline query metadata.
 *
 * For warehouses where unqualified queries are resolved via a session default
 * (Snowflake `USE SCHEMA`, BigQuery default dataset), users may write
 * `data="orders"` even though metadata is keyed by `<schema>.orders`. If the
 * direct lookup misses on a bare name, scan all loaded warehouse tables for
 * the first match by suffix. This keeps the validator lenient without needing
 * to know the developer's currently-selected schema.
 */
export function getTableFromContext(tableName: string, context: ValidationContext) {
	// First try regular metadata (only if not loading)
	if (context.metadata && !context.metadata.loading) {
		const table = context.metadata.getTable(tableName);
		if (table) return table;

		if (!tableName.includes('.')) {
			// Match case-insensitively to mirror Snowflake's identifier folding.
			const suffix = `.${tableName.toLowerCase()}`;
			for (const candidate of context.metadata.tables) {
				if (candidate.name.toLowerCase().endsWith(suffix)) return candidate;
			}
		}
	}

	// Then try inline query metadata (only if initialized)
	if (context.inlineQueryMetadata && context.inlineQueryMetadata.initialized) {
		const table = context.inlineQueryMetadata.getTable(tableName);
		// A failed DESCRIBE leaves an error + zero columns; skip it so validators degrade to no-metadata, not false "column missing".
		if (table && !table.error) return table;
	}

	return undefined;
}

/**
 * Strip PostgreSQL-style type casts from a column name
 * Handles patterns like: column::type, column::type(precision), column::schema.type, etc.
 * @param columnName - The column name that may include a type cast
 * @returns The column name with type cast removed
 */
export function stripTypeCast(columnName: string): string {
	if (!columnName || typeof columnName !== 'string') {
		return columnName;
	}

	return columnName.replace(
		/::[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?(?:\([^)]*\))?(?:\[\])?/g,
		''
	);
}

export function stripIdentifierQuotes(columnName: string): string {
	if (!columnName || typeof columnName !== 'string') {
		return columnName;
	}

	const trimmed = columnName.trim();
	if (trimmed.length < 2) return columnName;

	const first = trimmed[0];
	const last = trimmed[trimmed.length - 1];
	if (first === '"' && last === '"') {
		return trimmed.slice(1, -1).replace(/""/g, '"');
	}
	if (first === '`' && last === '`') {
		return trimmed.slice(1, -1).replace(/``/g, '`');
	}
	return columnName;
}

/**
 * Check if a value contains variable syntax ({{ ... }}).
 * Used by validators to skip validation for values that will be resolved at runtime.
 *
 * @param value - The value to check (typically an attribute value)
 * @returns True if the value contains variable syntax
 */
export function containsVariableSyntax(value: unknown): boolean {
	if (typeof value !== 'string') return false;
	return /\{\{[^}]+\}\}/.test(value);
}
