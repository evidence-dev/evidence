import { processColumnExpression } from '../../common/sql-expression-utils';
import { quoteUntrustedIdentifierPath, type SQLQueryConfig } from '../../common/sql-options';
import type { SqlDialect } from '../../../sql-dialect';

// The SQL-standard niladic functions, plus `system_user` from T-SQL. These read like
// plain identifiers but evaluate without parentheses, so quoting is what keeps one a
// column reference instead of a warehouse-identity leak. Verified against Postgres 17.
const NILADIC_KEYWORDS = new Set([
	'current_catalog',
	'current_database',
	'current_date',
	'current_role',
	'current_schema',
	'current_time',
	'current_timestamp',
	'current_user',
	'localtime',
	'localtimestamp',
	'session_user',
	'system_user',
	'user'
]);

export function resolveRepeatColumnExpression(
	columnTemplate: string,
	resolveColumn: (value: string) => string,
	dialect: SqlDialect
): string {
	// `column` is documented as a column name, so a value that arrives through a
	// variable is quoted as an identifier. An author who wants an expression writes
	// it around the variable (`upper({{picker}})`), which is left untouched.
	return columnTemplate.replace(/\{\{[^{}]+\}\}/g, (variable) => {
		const resolved = resolveColumn(variable);
		if (NILADIC_KEYWORDS.has(resolved.trim().toLowerCase())) {
			return dialect.quoteAlias(resolved.trim());
		}
		return quoteUntrustedIdentifierPath(resolved, dialect);
	});
}

export function buildRepeatQueryConfig({
	data,
	column,
	filterConditions,
	where,
	dialect
}: {
	data: string;
	column: string;
	filterConditions: string | undefined;
	where: string | undefined;
	dialect: SqlDialect;
}): SQLQueryConfig {
	// Deduplication is the GROUP BY's job — see Dropdown.svelte. A `DISTINCT` in the
	// expression would be copied into `GROUP BY DISTINCT col`, which Cube rejects.
	const valueProcessed = processColumnExpression(
		{
			value: `${column} as value`
		},
		dialect
	);
	const whereConditions = [`${column} IS NOT NULL`];
	if (filterConditions) whereConditions.push(filterConditions);
	if (where) whereConditions.push(where);

	return {
		// Left raw on purpose: generateSQLQuery resolves and quotes it. Resolving an
		// inline query here would leave a subquery for that guard to quote as a name.
		tableExpressionName: data,
		columns: [valueProcessed],
		where: whereConditions.join(' AND '),
		order: `${column} ASC`
	};
}
