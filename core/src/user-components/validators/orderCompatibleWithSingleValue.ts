import { isValidationContext, type Validator, containsVariableSyntax } from './types';
import { hasAgg, processColumnExpression } from '../common/sql-expression-utils';
import { defaultDialect } from '../../sql-dialect';

/**
 * Author-time guard for single-value components (big_value) whose generated
 * query is `SELECT <value> … GROUP BY ALL LIMIT 1`.
 *
 * Under that shape, `order` may only reference things that survive the
 * grouping. What's LEGAL (each case verified by executing generated SQL on
 * embedded ClickHouse):
 *   - an aggregate term (`count(*) desc` → "most frequent value",
 *     `sum(x) desc` → "top by metric")
 *   - the value expression itself, its alias, or (bare-column values) an
 *     expression over the grouped column (`upper(category)`)
 * What FAILS on the warehouse (ClickHouse 215 NOT_AN_AGGREGATE): a plain
 * column that isn't derived from the value — e.g. `order="year_date"` with
 * `value="value"` OR with `value="argMax(value, year_date)"`. That exact trap
 * previously surfaced as a silent blank render and burned a battle-test
 * session, including after the agent's CORRECT switch to argMax.
 *
 * When a `comparison` is configured the query also projects benchmark
 * dimension columns (all groupable) — too complex to model textually, so the
 * guard stands down rather than risk false positives.
 *
 * Deliberately biased toward false NEGATIVES: anything this misses now fails
 * loudly at runtime (the component error overlay + debug_code), whereas a
 * false positive blocks working pages.
 */
export const orderCompatibleWithSingleValue =
	(orderAttribute: string, valueAttribute: string): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const order = node.attributes[orderAttribute];
		const value = node.attributes[valueAttribute];
		if (!order || typeof order !== 'string') return [];
		if (!value || typeof value !== 'string') return [];
		// Variable-bearing attributes are resolved at runtime — skip.
		if (containsVariableSyntax(order) || containsVariableSyntax(value)) return [];
		// Comparison configs project extra groupable dimension columns.
		if (node.attributes.comparison) return [];

		const valueTrimmed = value.trim();
		const alias = processColumnExpression({ value: valueTrimmed }, defaultDialect).alias;
		const valueIsAggregate = hasAgg(valueTrimmed, defaultDialect);

		// `order` may list several terms, each optionally suffixed asc/desc.
		// Split on TOP-LEVEL commas only — `argMax(total, category) desc` is
		// one term; a naive split would produce the garbage term `category)`.
		const rawTerms: string[] = [];
		let depth = 0;
		let start = 0;
		for (let i = 0; i < order.length; i++) {
			const ch = order[i];
			if (ch === '(') depth++;
			else if (ch === ')') depth = Math.max(0, depth - 1);
			else if (ch === ',' && depth === 0) {
				rawTerms.push(order.slice(start, i));
				start = i + 1;
			}
		}
		rawTerms.push(order.slice(start));
		const orderTerms = rawTerms
			.map((t) =>
				t
					.trim()
					.replace(/\s+(asc|desc)$/i, '')
					.trim()
			)
			.filter(Boolean);

		const referencesValueColumn = (term: string): boolean => {
			// Bare-column values stay in the group, so any expression over that
			// column is orderable (`category`, `upper(category)`). Word-boundary
			// match; `_` counts as a word char, so `year` won't match `year_date`.
			if (valueIsAggregate) return false;
			const escaped = valueTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			return new RegExp(`(?:^|[^A-Za-z0-9_])${escaped}(?:$|[^A-Za-z0-9_])`, 'i').test(` ${term} `);
		};

		const isLegal = (term: string): boolean =>
			hasAgg(term, defaultDialect) ||
			term.toLowerCase() === valueTrimmed.toLowerCase() ||
			term.replace(/^["'`]|["'`]$/g, '').toLowerCase() === alias.toLowerCase() ||
			referencesValueColumn(term);

		const disallowed = orderTerms.filter((t) => !isLegal(t));
		if (disallowed.length === 0) return [];

		const offender = disallowed[0];
		const message = valueIsAggregate
			? `${orderAttribute}: "${value}" aggregates the whole result into a single row, and \`${offender}\` no longer exists after aggregation — the query will fail on the warehouse. Remove \`${orderAttribute}\`; the aggregate itself selects the row (e.g. \`argMax(value_column, ${offender})\` shows the value at the latest ${offender}).`
			: `${orderAttribute}: this component computes \`${valueAttribute}\` over the entire result (GROUP BY ALL), so \`${orderAttribute}="${order}"\` references \`${offender}\`, which isn't in the grouping, and the query will fail on the warehouse. To show the value at the latest \`${offender}\`, use \`${valueAttribute}="argMax(${valueTrimmed}, ${offender})"\` and remove \`${orderAttribute}\` — or order by an aggregate (e.g. \`count(*) desc\` for the most frequent value).`;

		return [
			{
				id: 'order-on-aggregated-value',
				level: 'error' as const,
				message,
				location: node.location
			}
		];
	};
