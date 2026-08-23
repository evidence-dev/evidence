import type { InlineQueries } from './inline-queries';

/**
 * Attributes whose value names a data source. `data` is the only reference attribute any built-in
 * component exposes today; if a component ever gains a second data slot, add its attribute name here.
 */
const DATA_ATTRIBUTES = ['data'] as const;

/**
 * The connection a component should query, or undefined for the page default.
 *
 * Order matters. A registered query is checked FIRST because custom-component
 * queries register as `<tag>:<query>`, which is shaped exactly like a
 * `<connection>:<table>` prefix — resolving the registry first keeps those
 * pointing at the component's own query.
 *
 * A bare table name deliberately returns undefined rather than searching every
 * catalog: resolution runs on the render path and must not depend on catalogs
 * being loaded, and must never turn a page that renders today into one that
 * throws. Validation does the catalog-wide search and tells the author to
 * qualify the reference.
 */
export function connectionForAttributes(
	attributes: Record<string, unknown> | undefined,
	inlineQueries: InlineQueries | undefined
): string | undefined {
	for (const key of DATA_ATTRIBUTES) {
		const value = attributes?.[key];
		if (typeof value !== 'string' || !value.trim()) continue;
		const connection = connectionForReferenceString(value, inlineQueries);
		if (connection) return connection;
	}
	return undefined;
}

/** The connection a single `data=` value names, or undefined for the default. */
export function connectionForReferenceString(
	reference: string,
	inlineQueries: InlineQueries | undefined
): string | undefined {
	const name = reference.trim();
	if (!name) return undefined;

	const declared = inlineQueries?.connectionFor(name);
	if (declared) return declared;
	// A known query without a declared connection uses the page default; return
	// before prefix parsing so `<tag>:<query>` is never read as a connection.
	if (inlineQueries?.has(name) || inlineQueries?.isSqlFile(name)) return undefined;

	// Only a REGISTERED connection name counts as a prefix — `splitConnectionPrefix`
	// leaves `schema:table` and unknown prefixes whole.
	return inlineQueries?.splitConnectionPrefix(name).connection;
}
