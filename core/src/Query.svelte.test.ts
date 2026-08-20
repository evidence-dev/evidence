// @vitest-environment jsdom — $effect.root is a no-op under the default node env
/**
 * A destroyed Query must do no work: runed's debounced resource never cancels
 * its timeout or aborts the signal at teardown. A string query hits the main
 * data fetcher directly, so `queryService.query` and `query.result` are the only
 * observable effects. Both teardown tests fail without the `_destroyed` guards.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushSync } from 'svelte';
import { Query, type QueryDependencies } from './Query.svelte';
import type { QueryResult } from './user-components/interfaces/query-service';
import { ClickHouseDialect } from './sql-dialect';
import { processColumnExpression } from './user-components/common/sql-expression-utils';

const DEBOUNCE = 500;

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

function queryResult(rows: Array<Record<string, unknown>> = []): QueryResult {
	return { rows: rows as never, columns: [], error: null };
}

/** Flush queued microtasks (await continuations) then Svelte's reactive graph. */
async function settle() {
	for (let i = 0; i < 5; i++) await Promise.resolve();
	flushSync();
}

function makeDeps(query: () => Promise<QueryResult>): QueryDependencies {
	return {
		connection: {
			id: 'default',
			type: 'managed',
			// dialect is never read on the string-query path (no SQL is generated)
			dialect: {} as never,
			query: query as QueryDependencies['connection']['query']
		},
		filterContexts: undefined,
		inlineQueries: undefined,
		projectSettings: undefined,
		defaultRefreshInterval: undefined
	};
}

describe('Query teardown guards', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('fires no query when the component is destroyed during the debounce window', async () => {
		const query = vi.fn(async () => queryResult());
		const cleanup = $effect.root(() => {
			void new Query(() => 'select 1', makeDeps(query), { debounce: DEBOUNCE });
		});

		flushSync(); // schedules the debounce timer; nothing fired yet
		expect(query).not.toHaveBeenCalled();

		cleanup(); // destroy before the timer fires
		vi.advanceTimersByTime(DEBOUNCE); // debounce fires; entry guard bails
		await settle();

		expect(query).not.toHaveBeenCalled();
	});

	it('drops the result when the component is destroyed while a query is in flight', async () => {
		const pending = deferred<QueryResult>();
		const query = vi.fn(() => pending.promise);

		let instance!: Query;
		const cleanup = $effect.root(() => {
			instance = new Query(() => 'select 1', makeDeps(query), { debounce: DEBOUNCE });
		});

		flushSync();
		vi.advanceTimersByTime(DEBOUNCE); // fetcher runs and awaits query()
		await settle();
		expect(query).toHaveBeenCalledTimes(1);

		cleanup(); // destroy mid-flight — runed won't abort the signal; only _destroyed bails
		pending.resolve(queryResult([{ a: 1 }]));
		await settle();

		expect(instance.result).toBeUndefined();
	});

	it('still delivers the result for a query that completes while the component is alive', async () => {
		const query = vi.fn(async () => queryResult([{ a: 1 }]));

		let instance!: Query;
		const cleanup = $effect.root(() => {
			instance = new Query(() => 'select 1', makeDeps(query), { debounce: DEBOUNCE });
		});

		flushSync();
		vi.advanceTimersByTime(DEBOUNCE);
		await settle();

		expect(query).toHaveBeenCalledTimes(1);
		expect(instance.result?.rows).toEqual([{ a: 1 }]);
		expect(instance.loading).toBe(false);

		cleanup();
	});
});

/**
 * The map carves itself out of the 10k `MAX_USER_LIMIT` by passing a raised
 * `maxUserLimit`. In sampling mode, `samplingCheckQuery` is the query actually
 * sent: it honors the user's explicit limit up to `maxUserLimit`, otherwise it
 * falls back to sampling at `NON_PIVOT_ROW_LIMIT` (2000). These assert the
 * carve-out flips exactly that boundary without touching the global default.
 */
describe('maxUserLimit carve-out', () => {
	const dialect = new ClickHouseDialect();

	function makeDialectDeps(): QueryDependencies {
		return {
			connection: {
				id: 'default',
				type: 'managed',
				dialect,
				query: (async () => queryResult()) as QueryDependencies['connection']['query']
			},
			filterContexts: undefined,
			inlineQueries: undefined,
			projectSettings: undefined,
			defaultRefreshInterval: undefined
		};
	}

	// A plain lat/lng SELECT with a 50k limit — above the 10k default, below the map cap.
	function pointConfig() {
		return {
			tableExpressionName: 'points',
			columns: [
				processColumnExpression({ value: 'lat' }, dialect),
				processColumnExpression({ value: 'lng' }, dialect)
			].filter((c) => c !== null),
			filterIds: [],
			limit: 50_000,
			fillProps: { useFill: false, series: '', xColumn: '' }
		};
	}

	function samplingSqlFor(options?: Partial<{ maxUserLimit: number }>): string | undefined {
		let sql: string | undefined;
		const cleanup = $effect.root(() => {
			const q = new Query(() => pointConfig(), makeDialectDeps(), {
				exceedRowLimitBehavior: 'sample',
				...options
			});
			sql = q.samplingCheckQuery;
		});
		flushSync();
		cleanup();
		return sql;
	}

	it('honors a 50k limit when maxUserLimit is raised to the map cap', () => {
		const sql = samplingSqlFor({ maxUserLimit: 100_000 });
		expect(sql).toContain('50000');
		expect(sql).not.toContain('2000');
	});

	it('samples a 50k limit down to 2k with the default 10k ceiling', () => {
		const sql = samplingSqlFor();
		expect(sql).toContain('2000');
		expect(sql).not.toContain('50000');
	});
});
