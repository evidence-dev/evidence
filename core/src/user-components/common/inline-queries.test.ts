import { describe, test, expect, beforeEach } from 'vitest';
import { InlineQueries, stripTrailingSemicolons } from './inline-queries';
import { Filters } from '../../Filters.svelte';

let inlineQueries = new InlineQueries({ filterContexts: undefined });

describe('Inline Queries', () => {
	// Clean up before and after each test to ensure isolation
	beforeEach(() => {
		inlineQueries = new InlineQueries({ filterContexts: undefined });
	});

	describe('stripTrailingSemicolons function', () => {
		test('should strip single trailing semicolon', () => {
			expect(stripTrailingSemicolons('SELECT * FROM users;')).toBe('SELECT * FROM users');
		});

		test('should strip multiple trailing semicolons', () => {
			expect(stripTrailingSemicolons('SELECT * FROM users;;')).toBe('SELECT * FROM users');
		});

		test('should strip semicolons with trailing whitespace', () => {
			expect(stripTrailingSemicolons('SELECT * FROM users;  ')).toBe('SELECT * FROM users');
		});

		test('should strip semicolons with trailing newlines and tabs', () => {
			expect(stripTrailingSemicolons('SELECT * FROM users;\n')).toBe('SELECT * FROM users');
			expect(stripTrailingSemicolons('SELECT * FROM users;\t')).toBe('SELECT * FROM users');
		});

		test('should preserve queries without trailing semicolons', () => {
			expect(stripTrailingSemicolons('SELECT * FROM users')).toBe('SELECT * FROM users');
		});

		test('should preserve semicolons followed by comments', () => {
			expect(stripTrailingSemicolons('SELECT * FROM users; -- comment')).toBe(
				'SELECT * FROM users; -- comment'
			);
		});

		test('should handle edge cases', () => {
			expect(stripTrailingSemicolons('')).toBe('');
			expect(stripTrailingSemicolons(';')).toBe('');
			expect(stripTrailingSemicolons(';;  ')).toBe('');
		});
	});

	describe('Basic functionality', () => {
		test('should add and retrieve inline queries', () => {
			const queryName = 'test_query';
			const queryExpression = 'SELECT * FROM users';

			inlineQueries.set(queryName, queryExpression);
			const retrieved = inlineQueries.getInterpolated(queryName);

			expect(retrieved).toBe('(SELECT * FROM users) "__ev_inline_test_query"');
		});

		test('should return undefined for non-existent queries', () => {
			const retrieved = inlineQueries.getInterpolated('non_existent');
			expect(retrieved).toBeUndefined();
		});

		test('should list all inline query names', () => {
			inlineQueries.set('query1', 'SELECT 1');
			inlineQueries.set('query2', 'SELECT 2');

			const queryNames = inlineQueries.getAllNames();
			expect(queryNames).toContain('query1');
			expect(queryNames).toContain('query2');
			expect(queryNames).toHaveLength(2);
		});

		test('should remove inline queries', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users');
			expect(inlineQueries.getInterpolated('test_query')).toBeDefined();

			inlineQueries.remove('test_query');
			expect(inlineQueries.getInterpolated('test_query')).toBeUndefined();
		});
	});

	describe('Semicolon stripping', () => {
		test('should strip single trailing semicolon', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users;');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT * FROM users) "__ev_inline_test_query"');
		});

		test('should strip multiple trailing semicolons', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users;;');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT * FROM users) "__ev_inline_test_query"');
		});

		test('should strip semicolons with trailing whitespace', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users;  ');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT * FROM users) "__ev_inline_test_query"');
		});

		test('should strip semicolons with trailing newlines', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users;\n');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT * FROM users) "__ev_inline_test_query"');
		});

		test('should strip semicolons with trailing tabs', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users;\t');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT * FROM users) "__ev_inline_test_query"');
		});

		test('should preserve semicolons in the middle of queries', () => {
			inlineQueries.set('test_query', 'SELECT *; FROM users WHERE id = 1;');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT *; FROM users WHERE id = 1) "__ev_inline_test_query"');
		});

		test('should preserve queries without trailing semicolons', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT * FROM users) "__ev_inline_test_query"');
		});

		test('should preserve semicolons followed by comments', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users; -- comment');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('(SELECT * FROM users; -- comment) "__ev_inline_test_query"');
		});

		test('should handle complex multiline queries', () => {
			const complexQuery = `SELECT 
				u.id,
				u.name,
				COUNT(o.id) as order_count
			FROM users u
			LEFT JOIN orders o ON u.id = o.user_id
			GROUP BY u.id, u.name
			ORDER BY order_count DESC;`;

			inlineQueries.set('complex_query', complexQuery);
			const retrieved = inlineQueries.getInterpolated('complex_query');

			const expectedWithoutSemicolon = complexQuery.replace(/;$/, '');
			expect(retrieved).toBe(`(${expectedWithoutSemicolon}) "__ev_inline_complex_query"`);
		});

		test('should handle edge case with only semicolons and whitespace', () => {
			inlineQueries.set('test_query', ';;  ');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toBe('() "__ev_inline_test_query"');
		});

		test('should handle queries with CTEs and trailing semicolons', () => {
			const cteQuery = `WITH user_stats AS (
				SELECT user_id, COUNT(*) as order_count
				FROM orders
				GROUP BY user_id
			)
			SELECT u.name, us.order_count
			FROM users u
			JOIN user_stats us ON u.id = us.user_id;`;

			inlineQueries.set('cte_query', cteQuery);
			const retrieved = inlineQueries.getInterpolated('cte_query');

			const expectedWithoutSemicolon = cteQuery.replace(/;$/, '');
			expect(retrieved).toBe(`(${expectedWithoutSemicolon}) "__ev_inline_cte_query"`);
		});
	});

	describe('Query wrapping', () => {
		test('should wrap queries in parentheses', () => {
			inlineQueries.set('test_query', 'SELECT * FROM users');
			const retrieved = inlineQueries.getInterpolated('test_query');

			expect(retrieved).toMatch(/^\(.+\) "[^"]+"$/);
		});

		test('should maintain consistent wrapping after semicolon stripping', () => {
			inlineQueries.set('my_query', 'SELECT * FROM users;');
			const withSemicolon = inlineQueries.getInterpolated('my_query');

			inlineQueries.set('my_query', 'SELECT * FROM users');
			const withoutSemicolon = inlineQueries.getInterpolated('my_query');

			expect(withSemicolon).toBe(withoutSemicolon);
		});
	});

	describe('Missing filter handling', () => {
		test('should return best-effort interpolated SQL when filter context is temporarily unavailable', () => {
			const filters = new Filters({
				url: undefined,
				updateUrl: undefined,
				projectSettings: undefined,
				dialect: undefined
			});
			const scopedInlineQueries = new InlineQueries({ filterContexts: [filters] });
			scopedInlineQueries.set(
				'daily_costs',
				`
					SELECT 1
					[[AND organization_id IN {{org_filter}}]]
				`
			);

			const result = scopedInlineQueries.getInterpolated('daily_costs');

			expect(result).toBeDefined();
			expect(result).toContain('SELECT 1');
			// We should never return raw template syntax when a filter is temporarily missing.
			expect(result).not.toContain('{{org_filter}}');
			expect(result).not.toContain('[[');
			expect(result).not.toContain(']]');
		});
	});

	// New directory structure: SQL files under the project-root `queries/` dir are
	// referenced via a leading slash (e.g. `/queries/orders`). Resolved from a
	// SEPARATE map so the convention is opt-in and never affects existing
	// (non-slash) query/sqlFile names.
	describe('Project-root SQL files (leading-slash convention)', () => {
		test('resolves a leading-slash name from the project map, with slashes in the alias replaced by underscores', () => {
			inlineQueries.setProjectSqlFiles({ 'queries/orders': 'SELECT * FROM orders;' });
			expect(inlineQueries.getInterpolated('/queries/orders')).toBe(
				'(SELECT * FROM orders) "__ev_inline_queries_orders"'
			);
		});

		test('getRaw returns the project-map content for a leading-slash name', () => {
			inlineQueries.setProjectSqlFiles({ 'queries/orders': 'SELECT 1;' });
			expect(inlineQueries.getRaw('/queries/orders')).toBe('SELECT 1');
		});

		test('isSqlFile is true for a known leading-slash name and false otherwise', () => {
			inlineQueries.setProjectSqlFiles({ 'queries/orders': 'SELECT 1' });
			expect(inlineQueries.isSqlFile('/queries/orders')).toBe(true);
			expect(inlineQueries.isSqlFile('/queries/missing')).toBe(false);
		});

		test('getAllNames includes project SQL files with a leading slash', () => {
			inlineQueries.set('inline_q', 'SELECT 1');
			inlineQueries.setSqlFiles({ orders: 'SELECT 2' });
			inlineQueries.setProjectSqlFiles({ 'queries/orders': 'SELECT 3' });
			const names = inlineQueries.getAllNames();
			expect(names).toContain('inline_q');
			expect(names).toContain('orders');
			expect(names).toContain('/queries/orders');
		});

		test('a leading-slash name falls through to pages-scoped sqlFiles when absent from the project map', () => {
			// No project SQL files set; a pages-scoped file happens to be keyed '/legacy'.
			inlineQueries.setSqlFiles({ '/legacy': 'SELECT 42' });
			expect(inlineQueries.getRaw('/legacy')).toBe('SELECT 42');
		});

		test('existing (non-slash) names are unaffected when project SQL files are present', () => {
			inlineQueries.set('inline_q', 'SELECT 1');
			inlineQueries.setSqlFiles({ orders: 'SELECT 2' });
			inlineQueries.setProjectSqlFiles({ 'queries/orders': 'SELECT 3' });
			// Inline query + pages-scoped sql file resolve exactly as before.
			expect(inlineQueries.getInterpolated('inline_q')).toBe('(SELECT 1) "__ev_inline_inline_q"');
			expect(inlineQueries.getInterpolated('orders')).toBe('(SELECT 2) "__ev_inline_orders"');
		});

		test('constructor strips trailing semicolons from project SQL files', () => {
			const scoped = new InlineQueries({ filterContexts: undefined }, undefined, undefined, {
				'queries/orders': 'SELECT * FROM orders;;  '
			});
			expect(scoped.getRaw('/queries/orders')).toBe('SELECT * FROM orders');
		});
	});

	// New project-root model (useRelativeResolution): the single #sqlFiles map is
	// keyed by full project-root path; refs resolve "from here / from root".
	describe('Relative resolution (new project-root model)', () => {
		const make = (basePath: string, sqlFiles: Record<string, string>) =>
			new InlineQueries({ filterContexts: undefined }, undefined, sqlFiles, undefined, {
				basePath,
				useRelativeResolution: true
			});

		test('no-slash ref resolves relative to the page dir (sibling)', () => {
			const iq = make('pages/home', { 'pages/new-query': 'SELECT 1' });
			expect(iq.isSqlFile('new-query')).toBe(true);
			expect(iq.getRaw('new-query')).toBe('SELECT 1');
			expect(iq.getInterpolated('new-query')).toBe('(SELECT 1) "__ev_inline_pages_new-query"');
		});

		test('no-slash ref resolves relative to a nested page dir', () => {
			const iq = make('pages/reports/q4', { 'pages/reports/orders': 'SELECT 2' });
			expect(iq.isSqlFile('orders')).toBe(true);
			expect(iq.getRaw('orders')).toBe('SELECT 2');
		});

		test('leading-slash ref resolves from the project root', () => {
			const iq = make('pages/reports/q4', { 'queries/orders': 'SELECT 3' });
			expect(iq.isSqlFile('/queries/orders')).toBe(true);
			expect(iq.getRaw('/queries/orders')).toBe('SELECT 3');
			expect(iq.getInterpolated('/queries/orders')).toBe('(SELECT 3) "__ev_inline_queries_orders"');
		});

		test('a non-sibling no-slash ref does NOT resolve (from-here only)', () => {
			const iq = make('pages/reports/q4', { 'pages/orders': 'SELECT 4' });
			// `orders` resolves to pages/reports/orders, which does not exist.
			expect(iq.isSqlFile('orders')).toBe(false);
			expect(iq.getRaw('orders')).toBeUndefined();
		});

		test('inline queries still resolve by exact name', () => {
			const iq = make('pages/home', {});
			iq.set('total', 'SELECT 5');
			expect(iq.getInterpolated('total')).toBe('(SELECT 5) "__ev_inline_total"');
		});

		test('setBasePath changes what relative refs resolve against', () => {
			const iq = make('pages/home', { 'pages/a/orders': 'SELECT 6' });
			expect(iq.isSqlFile('orders')).toBe(false);
			iq.setBasePath('pages/a/index');
			expect(iq.isSqlFile('orders')).toBe(true);
			expect(iq.getRaw('orders')).toBe('SELECT 6');
		});

		test('setUseRelativeResolution flips resolution mode at runtime', () => {
			// Start in legacy mode: full-path key matches exactly, relative does not.
			const iq = new InlineQueries(
				{ filterContexts: undefined },
				undefined,
				{ 'pages/orders': 'SELECT 7' },
				undefined,
				{ basePath: 'pages/home', useRelativeResolution: false }
			);
			expect(iq.isSqlFile('pages/orders')).toBe(true);
			expect(iq.isSqlFile('orders')).toBe(false);
			expect(iq.isSqlFile('/pages/orders')).toBe(false);

			// Flip to the new model: from-here + from-root resolve, exact full path no longer.
			iq.setUseRelativeResolution(true);
			expect(iq.isSqlFile('orders')).toBe(true); // pages/home -> pages/orders
			expect(iq.isSqlFile('/pages/orders')).toBe(true);
			expect(iq.getRaw('/pages/orders')).toBe('SELECT 7');
		});
	});
});
