// @vitest-environment jsdom
/**
 * EVI-3119 regression: on a builtin filter change (e.g. dropdown), the resolved
 * SQL that Query sends changes (its filter predicate is baked in), but the
 * chart's `queryGetter()` — which returns a `SQLQueryConfig` carrying only the
 * filter *ids*, not their values — is byte-identical across the change.
 *
 * The watch that sets `_manualLoading = true` used to read `queryGetter()` and
 * therefore never fired for that path. `query.loading` stayed false through the
 * refetch, no spinner rendered, and the chart's
 *
 *   const ready = $derived(!query.loading);
 *   $effect(() => { if (ready) stableOptions = options; });
 *
 * gate was never armed, opening a race that could leave stale options in the
 * chart until the next filter interaction. The fix moves the watch to the
 * resolved `dataQuery` (which interpolates filter predicates) so any change
 * that will actually trigger a refetch flips loading immediately.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushSync } from 'svelte';
import { Query, type QueryDependencies } from './Query.svelte';
import type { QueryResult } from './user-components/interfaces/query-service';
import { ClickHouseDialect } from './sql-dialect';
import { CubeDialect } from './sql-dialect/cube';
import { Filters } from './Filters.svelte';
import { DropdownFilter } from './user-components/tags/dropdown/DropdownFilter.svelte';
import type { FilterDeps } from './Filter.svelte';
import { processColumnExpression } from './user-components/common/sql-expression-utils';
import type { SQLQueryConfig } from './user-components/common/sql-options';

const DEBOUNCE = 500;

function queryResult(rows: Array<Record<string, unknown>> = []): QueryResult {
	return { rows: rows as never, columns: [], error: null };
}

async function settle() {
	for (let i = 0; i < 10; i++) await Promise.resolve();
	flushSync();
}

describe('EVI-3119: chart loading and stableOptions after builtin filter change', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('flips loading true immediately on filter change and lands new data in stableOptions', async () => {
		const dialect = new ClickHouseDialect();

		const filterDeps: FilterDeps = {
			url: undefined,
			updateUrl: undefined,
			projectSettings: undefined,
			dialect: () => dialect
		};
		const pageFilters = new Filters(filterDeps);

		const catFilter = pageFilters.create(
			{
				id: 'cat',
				userComponentName: 'dropdown',
				attributes: { value_column: 'category', multiple: false }
			} as ConstructorParameters<typeof DropdownFilter>[0],
			DropdownFilter
		);
		catFilter.value = 'A';

		const runQuery = vi.fn(async (sql: string) => {
			if (sql.includes("'A'")) return queryResult([{ category: 'A', amount: 100 }]);
			if (sql.includes("'B'")) return queryResult([{ category: 'B', amount: 200 }]);
			return queryResult([]);
		});

		const deps: QueryDependencies = {
			connection: {
				id: 'default',
				type: 'managed',
				dialect,
				query: runQuery as QueryDependencies['connection']['query']
			},
			filterContexts: [pageFilters],
			inlineQueries: undefined,
			projectSettings: undefined,
			defaultRefreshInterval: undefined
		};

		let observedStableOptions!: () => { data?: Array<{ category: string; amount: number }> };
		let observedLoading!: () => boolean;
		let observedReady!: () => boolean;

		const cleanup = $effect.root(() => {
			// The chart's queryConfig deliberately does NOT read filter.value: the
			// filter is applied through `filterIds`, and its predicate is resolved
			// inside Query.dataQuery. This is the shape every builtin-filter path
			// takes.
			const queryConfig = $derived<SQLQueryConfig>({
				tableExpressionName: 'orders',
				tableExpressionIsSql: true,
				columns: [
					processColumnExpression({ value: 'category' }, dialect),
					processColumnExpression({ value: 'amount' }, dialect)
				].filter((c) => c !== null),
				filterIds: ['cat'],
				where: undefined,
				having: undefined,
				qualify: undefined,
				order: undefined,
				limit: undefined,
				date_range: undefined
			});

			const query = new Query(() => queryConfig, deps, { debounce: DEBOUNCE });

			const data = $derived(query.result?.rows ?? []);
			const options = $derived({
				data: (data as Array<{ category: string; amount: number }>).map((r) => r)
			});

			const ready = $derived(!query.loading);
			let stableOptions: { data?: Array<{ category: string; amount: number }> } = $state({});

			$effect(() => {
				if (ready) {
					stableOptions = options;
				}
			});

			observedStableOptions = () => stableOptions;
			observedLoading = () => query.loading;
			observedReady = () => ready;
		});

		flushSync();
		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(runQuery).toHaveBeenCalledTimes(1);
		expect(runQuery.mock.calls[0][0]).toContain("'A'");
		expect(observedStableOptions().data).toEqual([{ category: 'A', amount: 100 }]);
		expect(observedLoading()).toBe(false);
		expect(observedReady()).toBe(true);

		catFilter.value = 'B';
		flushSync();

		// Regression assertion: loading must flip true right away so the chart's
		// `ready` gate closes for the duration of the refetch. Before the fix
		// this stayed false because the watch read the (stable) queryGetter output.
		expect(observedLoading()).toBe(true);
		expect(observedReady()).toBe(false);

		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(runQuery).toHaveBeenCalledTimes(2);
		expect(runQuery.mock.calls[1][0]).toContain("'B'");
		expect(observedLoading()).toBe(false);
		expect(observedStableOptions().data).toEqual([{ category: 'B', amount: 200 }]);

		cleanup();
	});

	it('does not flip loading when SQL generation breaks, and settles after recovery', async () => {
		// Cube rejects GROUPING SETS, so `subtotals: true` makes generateSQLQuery
		// return an error and `dataQuery` resolve to `undefined`. The watch must
		// not treat that valid → undefined transition as a refetch: no fetch that
		// returns data will follow, so flipping loading immediately would show a
		// spinner for a query that will never run. (Once the fetcher actually
		// executes and wipes the stale result, the resource's own loading state
		// takes over — that part is unchanged.)
		const dialect = new CubeDialect();

		const runQuery = vi.fn(async () => queryResult([{ category: 'A', amount: 100 }]));

		const deps: QueryDependencies = {
			connection: {
				id: 'default',
				type: 'managed',
				dialect,
				query: runQuery as QueryDependencies['connection']['query']
			},
			filterContexts: undefined,
			inlineQueries: undefined,
			projectSettings: undefined,
			defaultRefreshInterval: undefined
		};

		let observedLoading!: () => boolean;
		let observedResult!: () => Array<{ category: string; amount: number }> | undefined;

		let subtotals = $state(false);

		const cleanup = $effect.root(() => {
			const queryConfig = $derived<SQLQueryConfig>({
				tableExpressionName: 'orders',
				tableExpressionIsSql: true,
				columns: [
					processColumnExpression({ value: 'category' }, dialect),
					processColumnExpression({ value: 'amount' }, dialect)
				].filter((c) => c !== null),
				subtotals,
				where: undefined,
				having: undefined,
				qualify: undefined,
				order: undefined,
				limit: undefined,
				date_range: undefined
			});

			const query = new Query(() => queryConfig, deps, { debounce: DEBOUNCE });

			observedLoading = () => query.loading;
			observedResult = () => query.result?.rows as Array<{ category: string; amount: number }>;
		});

		// Start valid: the query runs and settles with loading false.
		flushSync();
		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(runQuery).toHaveBeenCalledTimes(1);
		expect(observedLoading()).toBe(false);

		// Break SQL generation: dataQuery goes valid → undefined. During the
		// debounce window the watch must not have flipped loading — this is the
		// regression assertion for the guard.
		subtotals = true;
		flushSync();
		expect(observedLoading()).toBe(false);

		vi.advanceTimersByTime(DEBOUNCE);
		await settle();
		expect(runQuery).toHaveBeenCalledTimes(1);

		// Recover: SQL generates again → fetch runs → loading must settle to
		// false and the fresh data must land.
		subtotals = false;
		flushSync();
		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(runQuery).toHaveBeenCalledTimes(2);
		expect(observedResult()).toEqual([{ category: 'A', amount: 100 }]);
		expect(observedLoading()).toBe(false);

		cleanup();
	});

	it('surfaces the SQL-generation error and settles loading false, then recovers', async () => {
		// Same trigger as above (Cube + subtotals), but this asserts the error
		// *surfaces*: instead of an infinite spinner, query.error carries the
		// generateSQLQuery message, loading settles false, and result is wiped.
		const dialect = new CubeDialect();

		const runQuery = vi.fn(async () => queryResult([{ category: 'A', amount: 100 }]));

		const deps: QueryDependencies = {
			connection: {
				id: 'default',
				type: 'managed',
				dialect,
				query: runQuery as QueryDependencies['connection']['query']
			},
			filterContexts: undefined,
			inlineQueries: undefined,
			projectSettings: undefined,
			defaultRefreshInterval: undefined
		};

		let observedLoading!: () => boolean;
		let observedError!: () => string | null;
		let observedResult!: () => Array<{ category: string; amount: number }> | undefined;

		let subtotals = $state(false);

		const cleanup = $effect.root(() => {
			const queryConfig = $derived<SQLQueryConfig>({
				tableExpressionName: 'orders',
				tableExpressionIsSql: true,
				columns: [
					processColumnExpression({ value: 'category' }, dialect),
					processColumnExpression({ value: 'amount' }, dialect)
				].filter((c) => c !== null),
				subtotals,
				where: undefined,
				having: undefined,
				qualify: undefined,
				order: undefined,
				limit: undefined,
				date_range: undefined
			});

			const query = new Query(() => queryConfig, deps, { debounce: DEBOUNCE });

			observedLoading = () => query.loading;
			observedError = () => query.error;
			observedResult = () => query.result?.rows as Array<{ category: string; amount: number }>;
		});

		// Valid first load: data lands, no error.
		flushSync();
		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(runQuery).toHaveBeenCalledTimes(1);
		expect(observedLoading()).toBe(false);
		expect(observedError()).toBeNull();
		expect(observedResult()).toEqual([{ category: 'A', amount: 100 }]);

		// Break SQL generation. The fetcher then runs with `undefined` SQL and
		// wipes the stale result; without the fix, loading reads true forever and
		// the error never surfaces.
		subtotals = true;
		flushSync();
		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(runQuery).toHaveBeenCalledTimes(1);
		expect(observedLoading()).toBe(false);
		expect(observedError()).toContain('subtotals');
		expect(observedResult()).toBeUndefined();

		// Recover: error clears, fetch runs, fresh data lands, loading settles.
		subtotals = false;
		flushSync();
		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(runQuery).toHaveBeenCalledTimes(2);
		expect(observedError()).toBeNull();
		expect(observedResult()).toEqual([{ category: 'A', amount: 100 }]);
		expect(observedLoading()).toBe(false);

		cleanup();
	});
});
