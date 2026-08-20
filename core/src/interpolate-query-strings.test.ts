import { describe, it, expect } from 'vitest';
import {
	interpolateQueryStrings,
	extractFilterIds,
	hasTemplating
} from './interpolate-query-strings';
import { Filters } from './Filters.svelte';
import { ToggleFilter } from './user-components/tags/toggle/ToggleFilter.svelte';
import type { FilterClass } from './Filter.svelte';
import { InlineQueries } from './user-components/common/inline-queries';

function createFiltersWithToggle(value: boolean): Filters {
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: undefined
	});

	const toggle = filters.create(
		{
			id: 'include_weekly',
			userComponentName: 'toggle',
			attributes: { invert: false, initial_value: false }
		},
		ToggleFilter as unknown as FilterClass<'toggle', Record<string, unknown>>
	) as ToggleFilter;

	toggle.value = value;
	return filters;
}

describe('interpolateQueryStrings', () => {
	it('formats toggle booleans as SQL literals in sql context', () => {
		const filters = createFiltersWithToggle(true);
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });

		const result = interpolateQueryStrings(
			'SELECT CASE WHEN {{include_weekly}} THEN 1 ELSE 0 END',
			[filters],
			inlineQueries,
			'sql'
		);

		expect(result.errors).toEqual([]);
		expect(result.sql).toContain('CASE WHEN true THEN 1 ELSE 0 END');
	});

	it('preserves boolean casing behavior for text context', () => {
		const filters = createFiltersWithToggle(false);
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });

		const result = interpolateQueryStrings(
			'Toggle is {{include_weekly}}',
			[filters],
			inlineQueries,
			'text'
		);

		expect(result.errors).toEqual([]);
		expect(result.sql).toBe('Toggle is false');
	});

	describe('zero-width character handling', () => {
		// Regression: pasting from chat apps / AI tools / rich-text editors can
		// inject invisible zero-width chars between `{` and `{`, which makes the
		// literal `{{` substring no longer match. Without stripping, the bracket
		// balancer reports "Unbalanced template brackets" on visually valid input.
		it('strips U+200B between {{ so brackets balance correctly', () => {
			const filters = createFiltersWithToggle(true);
			const inlineQueries = new InlineQueries({ filterContexts: [filters] });

			const sqlWithZwsp = 'SELECT CASE WHEN {\u200B{include_weekly}} THEN 1 ELSE 0 END';

			const result = interpolateQueryStrings(sqlWithZwsp, [filters], inlineQueries, 'sql');

			expect(result.errors).toEqual([]);
			expect(result.sql).toContain('CASE WHEN true THEN 1 ELSE 0 END');
		});

		it.each([
			['U+200B Zero Width Space', '\u200B'],
			['U+200C Zero Width Non-Joiner', '\u200C'],
			['U+200D Zero Width Joiner', '\u200D'],
			['U+FEFF Byte Order Mark', '\uFEFF']
		])('strips %s between brackets', (_label, ch) => {
			const filters = createFiltersWithToggle(true);
			const inlineQueries = new InlineQueries({ filterContexts: [filters] });

			const result = interpolateQueryStrings(
				`SELECT {${ch}{include_weekly}}`,
				[filters],
				inlineQueries,
				'sql'
			);

			expect(result.errors).toEqual([]);
			expect(result.sql).toBe('SELECT true');
		});
	});
});

// extractFilterIds and hasTemplating are exercised by reactive consumers
// (e.g. inline-query-metadata) to detect filter dependencies and gate
// interpolation. If they don't strip zero-width chars, a pasted query
// with a ZWSP between {{ would silently miss filter dependency tracking
// and skip interpolation entirely — leading to stale or broken queries
// even though `interpolateQueryStrings` itself handles the same input.
describe('extractFilterIds zero-width tolerance', () => {
	it('finds filter IDs in templates that contain U+200B between {{', () => {
		const ids = extractFilterIds('SELECT * FROM t WHERE x = {\u200B{country_filter.value}}');
		expect(ids).toEqual(['country_filter']);
	});

	it.each([
		['U+200B', '\u200B'],
		['U+200C', '\u200C'],
		['U+200D', '\u200D'],
		['U+FEFF', '\uFEFF']
	])('finds filter IDs in templates that contain %s between {{', (_label, ch) => {
		const ids = extractFilterIds(`{${ch}{my_filter.value}}`);
		expect(ids).toEqual(['my_filter']);
	});
});

describe('hasTemplating zero-width tolerance', () => {
	it('detects templates that contain U+200B between {{', () => {
		expect(hasTemplating('SELECT {\u200B{filter.value}} FROM t')).toBe(true);
	});

	it('detects conditional blocks that contain U+200B between [[', () => {
		expect(hasTemplating('SELECT * FROM t [\u200B[WHERE x = 1]]')).toBe(true);
	});

	it.each([
		['U+200B', '\u200B'],
		['U+200C', '\u200C'],
		['U+200D', '\u200D'],
		['U+FEFF', '\uFEFF']
	])('detects templates that contain %s between {{', (_label, ch) => {
		expect(hasTemplating(`{${ch}{filter.value}}`)).toBe(true);
	});
});

describe('bare-name SQL file reference suggestions', () => {
	// The dead end this prevents: an author (or the AI agent) writes
	// `{{ daily_orders_recent }}` for a file at `queries/daily_orders_recent`.
	// A bare name resolves relative to the page (`pages/...`) so the file is
	// missed, and the old error said "Missing filter ID" — sending them down a
	// filter rabbit hole instead of teaching the absolute-path form.
	const makeInlineQueries = (filters: Filters) =>
		new InlineQueries(
			{ filterContexts: [filters] },
			undefined,
			{ 'queries/daily_orders_recent': 'select 1 as n' },
			undefined,
			{ basePath: 'pages/home', useRelativeResolution: true }
		);

	it('suggests the absolute SQL-file path when a bare name matches a file basename', () => {
		const filters = createFiltersWithToggle(true);
		const inlineQueries = makeInlineQueries(filters);

		const result = interpolateQueryStrings(
			'select * from {{ daily_orders_recent }}',
			[filters],
			inlineQueries,
			'sql'
		);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain('is not a filter');
		expect(result.errors[0]).toContain('{{ /queries/daily_orders_recent }}');
	});

	it('still reports a plain missing filter when nothing matches', () => {
		const filters = createFiltersWithToggle(true);
		const inlineQueries = makeInlineQueries(filters);

		const result = interpolateQueryStrings(
			'select * from {{ totally_unknown }}',
			[filters],
			inlineQueries,
			'sql'
		);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain('Missing filter ID');
	});

	it('the absolute-path form resolves (the suggested fix actually works)', () => {
		const filters = createFiltersWithToggle(true);
		const inlineQueries = makeInlineQueries(filters);

		const result = interpolateQueryStrings(
			'select * from {{ /queries/daily_orders_recent }}',
			[filters],
			inlineQueries,
			'sql'
		);

		expect(result.errors).toEqual([]);
		expect(result.sql).toContain('select 1 as n');
	});
});

describe('quoted SQL-file references (the documented form)', () => {
	// docs/features/sql-files shows `FROM {{ "/queries/orders_by_date" }}` —
	// the quoted token used to fall through to the filter branch and error
	// "Missing filter ID". Both quote styles must classify as a file reference.
	const makeInlineQueries = (filters: Filters) =>
		new InlineQueries(
			{ filterContexts: [filters] },
			undefined,
			{ 'queries/orders_by_date': 'select 2 as n' },
			undefined,
			{ basePath: 'pages/home', useRelativeResolution: true }
		);

	it.each([
		['double quotes', 'select * from {{ "/queries/orders_by_date" }}'],
		['single quotes', "select * from {{ '/queries/orders_by_date' }}"]
	])('resolves the path in %s', (_label, sql) => {
		const filters = createFiltersWithToggle(true);
		const inlineQueries = makeInlineQueries(filters);

		const result = interpolateQueryStrings(sql, [filters], inlineQueries, 'sql');

		expect(result.errors).toEqual([]);
		expect(result.sql).toContain('select 2 as n');
	});
});

// Regression: a `{{...}}` written inside a SQL comment is documentation, not a
// live reference. Interpolating it rewrites comment prose, can emit invalid
// SQL, and — when the token names the query's own inline-query — sends the
// interpolator into infinite recursion. A production page (provider-presence)
// crashed the whole render with `RangeError: Maximum call stack size exceeded`
// because a query's own name appeared inside its `--` comment. These guard
// both the comment-masking fix and the cycle guard that backs it up.
describe('comment tokens are not interpolated', () => {
	it('does not interpolate {{...}} inside a line comment', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		const result = interpolateQueryStrings(
			'SELECT 1 -- documented in {{some_filter}}\nFROM t',
			[],
			iq
		);
		expect(result.errors).toEqual([]);
		expect(result.sql).toBe('SELECT 1 -- documented in {{some_filter}}\nFROM t');
	});

	it('does not interpolate {{...}} inside a block comment', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		const result = interpolateQueryStrings('/* refs {{some_filter}} */ SELECT 1', [], iq);
		expect(result.errors).toEqual([]);
		expect(result.sql).toBe('/* refs {{some_filter}} */ SELECT 1');
	});

	it('does not recurse when a query self-references inside its own comment', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.set(
			'base',
			'-- all {{base}} consumers keep working\nSELECT requested_at FROM analytics.fct'
		);

		let result!: ReturnType<typeof interpolateQueryStrings>;
		expect(() => {
			result = interpolateQueryStrings('SELECT * FROM {{base}}', [], iq);
		}).not.toThrow();
		expect(result.errors).toEqual([]);
		// The self-reference in the comment is preserved verbatim, not expanded.
		expect(result.sql).toContain('-- all {{base}} consumers keep working');
	});

	it('still treats -- inside a string literal as SQL, not a comment', () => {
		const filters = createFiltersWithToggle(true);
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		const result = interpolateQueryStrings(
			"SELECT '--' AS dash, {{include_weekly}} AS flag",
			[filters],
			inlineQueries,
			'sql'
		);
		expect(result.errors).toEqual([]);
		expect(result.sql).toBe("SELECT '--' AS dash, true AS flag");
	});

	it('does not register comment-only tokens as filter dependencies', () => {
		expect(extractFilterIds('SELECT 1 -- depends on {{country_filter}}')).toEqual([]);
		expect(extractFilterIds('SELECT {{country_filter}} -- and {{other}}')).toEqual([
			'country_filter'
		]);
	});

	it('ignores template tokens that appear only inside a comment', () => {
		expect(hasTemplating('SELECT 1 -- see {{other_query}}')).toBe(false);
		expect(hasTemplating('/* uses {{other_query}} */ SELECT 1')).toBe(false);
	});
});

// Regression: a direct or mutual inline-query cycle must surface a graceful
// "Circular inline query reference" error instead of overflowing the JS stack.
describe('inline query cycle guard', () => {
	it('reports a direct self-reference instead of overflowing the stack', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.set('a', 'SELECT * FROM {{a}}');

		let result!: ReturnType<typeof interpolateQueryStrings>;
		expect(() => {
			result = interpolateQueryStrings('SELECT * FROM {{a}}', [], iq);
		}).not.toThrow();
		expect(result.errors).toContain('Circular inline query reference: `a`');
	});

	it('reports a mutual reference cycle instead of overflowing the stack', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.set('a', 'SELECT * FROM {{b}}');
		iq.set('b', 'SELECT * FROM {{a}}');

		let result!: ReturnType<typeof interpolateQueryStrings>;
		expect(() => {
			result = interpolateQueryStrings('SELECT * FROM {{a}}', [], iq);
		}).not.toThrow();
		expect(result.errors.some((e) => e.startsWith('Circular inline query reference:'))).toBe(true);
	});

	it('still resolves a diamond (non-cyclic) reference graph', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.set('shared', 'SELECT 1');
		iq.set('left', 'SELECT * FROM {{shared}}');
		iq.set('right', 'SELECT * FROM {{shared}}');

		const result = interpolateQueryStrings(
			'SELECT * FROM {{left}} UNION ALL SELECT * FROM {{right}}',
			[],
			iq
		);
		expect(result.errors).toEqual([]);
		expect(result.sql).toContain('(SELECT * FROM (SELECT 1))');
	});
});
