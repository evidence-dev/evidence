import {
	isValidationContext,
	type Validator,
	getTableFromContext,
	containsVariableSyntax
} from './types';

export const tableExists =
	(tableNameAttribute: string): Validator =>
	(node, config, context) => {
		if (!isValidationContext(context)) return [];

		const tableName = node.attributes[tableNameAttribute];
		if (!tableName || typeof tableName !== 'string') return [];

		// Skip validation if value contains variable syntax - will be validated at runtime
		if (containsVariableSyntax(tableName)) return [];

		// A `connection:table` reference: validate the connection, then its table against THAT
		// connection's catalog. A registered query (`<tag>:<query>`) or sql file legitimately
		// contains a colon and is exempt (checked below). Dormant until connection names exist.
		const colon = tableName.indexOf(':');
		const iq = context.inlineQueries;
		if (colon > 0 && iq?.connectionNames && iq.connectionNames().length > 0) {
			const prefix = tableName.slice(0, colon);
			const isQueryName = iq.getPublicNames?.().includes(tableName) || iq.isSqlFile?.(tableName);
			// Only treat the colon as connection syntax when the prefix is a REGISTERED connection; an
			// unregistered prefix is left literal (matching the resolver) and handled after this block.
			if (!isQueryName && iq.isConnectionName(prefix)) {
				// Known connection — check the table against THAT connection's catalog.
				const strippedTable = tableName.slice(colon + 1);
				if (iq.isSqlFile?.(strippedTable)) return [];
				const strippedNames = iq.getPublicNames?.() ?? iq.getAllNames();
				if (strippedNames.includes(strippedTable)) return [];

				const connectionCatalog = context.metadataForConnection?.(prefix);
				if (connectionCatalog) {
					if (connectionCatalog.loading || connectionCatalog.loadFailed) return [];
					if (connectionCatalog.getTable(strippedTable)) return [];
					// Bare name against a catalog keyed `<schema>.<table>` (mirrors getTableFromContext).
					if (!strippedTable.includes('.')) {
						const suffix = `.${strippedTable.toLowerCase()}`;
						if (connectionCatalog.tables.some((t) => t.name.toLowerCase().endsWith(suffix))) {
							return [];
						}
					}
					return [
						{
							id: 'invalid-table',
							level: 'error',
							message: `${tableNameAttribute}: Table "${strippedTable}" does not exist in connection "${prefix}"`,
							location: node.location
						}
					];
				}

				if (!context.metadataForConnection) {
					// Single-connection/CLI: the ambient metadata IS this connection's catalog.
					if (getTableFromContext(strippedTable, context)) return [];
					if (!context.metadata || context.metadata.loading || context.metadata.loadFailed) {
						return [];
					}
					return [
						{
							id: 'invalid-table',
							level: 'error',
							message: `${tableNameAttribute}: Table "${strippedTable}" does not exist in connection "${prefix}"`,
							location: node.location
						}
					];
				}

				// A resolver exists but has no catalog for this connection yet (still loading, or it
				// isn't the default). Ambient metadata is the DEFAULT warehouse's, so a miss there says
				// nothing about THIS connection — a hit still passes, but a miss must not error.
				if (getTableFromContext(strippedTable, context)) return [];
				return [];
			}

			// Unregistered prefix (and not a query/sql-file name): the resolver leaves `prefix:table`
			// WHOLE, so it must validate as an ordinary reference below — a stray colon or a colon
			// convention must never hard-error as connection syntax. The one case worth catching is a
			// mistyped connection in front of a REAL table (`snowflke:orders`): when the stripped table
			// clearly resolves but the whole literal does not, surface the connection hint. Otherwise
			// fall through and let the whole `prefix:table` be validated as a plain table name.
			if (!isQueryName && !iq.isConnectionName(prefix)) {
				const strippedTable = tableName.slice(colon + 1);
				const names = iq.getPublicNames?.() ?? iq.getAllNames?.() ?? [];
				const resolves = (name: string) =>
					!!getTableFromContext(name, context) || names.includes(name) || !!iq.isSqlFile?.(name);
				if (!resolves(tableName) && resolves(strippedTable)) {
					return [
						{
							id: 'unknown-connection',
							level: 'error',
							message: `${tableNameAttribute}: no connection named "${prefix}". Available connections: ${iq.connectionNames().join(', ')}.`,
							location: node.location
						}
					];
				}
			}
		}

		// Try to get table from either regular metadata or inline query metadata
		const table = getTableFromContext(tableName, context);
		if (table) return [];

		// If no table metadata found, check if it resolves to a SQL file
		// (handles the new "from here / from root" model) or matches an inline
		// query name (metadata might not be loaded yet). PUBLIC names only:
		// component-scoped queries (`<tag>:<name>`) are private to their
		// component — an author typing `data="kpi_card:revenue"` on a page must
		// get a does-not-exist error, not a pass.
		if (context.inlineQueries) {
			if (
				typeof context.inlineQueries.isSqlFile === 'function' &&
				context.inlineQueries.isSqlFile(tableName)
			) {
				return [];
			}
			const inlineQueryNames =
				typeof context.inlineQueries.getPublicNames === 'function'
					? context.inlineQueries.getPublicNames()
					: context.inlineQueries.getAllNames();
			if (inlineQueryNames.includes(tableName)) return [];
		}

		// No metadata at all (e.g. CLI syntax-only, no warehouse access), still
		// loading, or the load failed (e.g. catalog query timeout): skip — we
		// can't assert a table doesn't exist without a loaded catalog.
		if (!context.metadata || context.metadata.loading || context.metadata.loadFailed) return [];

		// Fuzzy-match against actual SQL-file keys to suggest the correct
		// absolute form. Project-root projects resolve `data="foo"` "from
		// here" — so a reference inside `pages/home` resolves to
		// `pages/foo`, which never matches an actual `queries/foo` SQL
		// file. The most common agent mistake is a bare name
		// (`data="foo"`) that expects the resolver to find the file
		// regardless of where it lives; the second-most common is
		// `data="queries/foo"` (relative, resolves to `pages/queries/foo`).
		// Both fail the same way. If any real key ends with `/<basename>`
		// (or matches the whole input with a leading slash), suggest it.
		const useRelativeResolution = (config as { evidenceUseRelativeResolution?: boolean })
			?.evidenceUseRelativeResolution;
		if (useRelativeResolution && context.inlineQueries) {
			const inputBasename = tableName.replace(/^\/+/, '').split('/').pop() ?? '';
			const allSqlFileKeys = context.inlineQueries
				.getAllNames()
				// Restrict to keys that look like SQL-file paths (skip inline
				// query names that already coexist with the file's short
				// name — e.g. an inline `sql foo` block on the page).
				.filter((n) => n.includes('/'));
			const matches = allSqlFileKeys.filter((k) => {
				const bn = k.split('/').pop();
				return bn === inputBasename;
			});
			if (matches.length === 1) {
				const suggestion = `/${matches[0].replace(/^\/+/, '')}`;
				return [
					{
						id: 'invalid-table',
						level: 'error',
						message: `${tableNameAttribute}: "${tableName}" did not resolve to a table or SQL file. A SQL file exists at "${matches[0]}" — reference it with the absolute path "${suggestion}" (leading slash = "from the project root").`,
						location: node.location
					}
				];
			}
			if (matches.length > 1) {
				const suggestions = matches
					.map((k) => `"/${k.replace(/^\/+/, '')}"`)
					.slice(0, 5)
					.join(', ');
				return [
					{
						id: 'invalid-table',
						level: 'error',
						message: `${tableNameAttribute}: "${tableName}" is ambiguous — multiple SQL files match. Use the absolute path: ${suggestions}.`,
						location: node.location
					}
				];
			}
		}

		return [
			{
				id: 'invalid-table',
				level: 'error',
				message: `${tableNameAttribute}: Table "${tableName}" does not exist`,
				location: node.location
			}
		];
	};
