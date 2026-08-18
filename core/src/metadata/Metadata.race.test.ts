import { describe, it, expect } from 'vitest';
import { Metadata } from './Metadata.svelte';
import type { QueryResult, AnyRowType } from '../user-components/interfaces/query-service';

// Defers every query so the test can interleave two load() calls and resolve
// them out of order, reproducing a slow earlier load finishing after a newer one.
class DeferredQueryService {
	readonly workspaceId = 'org1';
	readonly dialect = { caseInsensitiveIdentifiers: false } as never;
	#pending: Array<(r: QueryResult<never>) => void> = [];

	query<T extends AnyRowType>(): Promise<QueryResult<T>> {
		return new Promise<QueryResult<T>>((resolve) => {
			this.#pending.push(resolve as (r: QueryResult<never>) => void);
		});
	}

	// Resolve the Nth outstanding query() (managed load fires cols, views, models).
	resolve(index: number, result: QueryResult<never>) {
		this.#pending[index](result);
	}
}

const columns = (rows: unknown[]): QueryResult<never> =>
	({ rows, columns: [], error: null }) as unknown as QueryResult<never>;
const empty: QueryResult<never> = { rows: [], columns: [], error: null } as never;
const failed: QueryResult<never> = { rows: [], columns: [], error: 'boom' } as never;
const orderDetailsRows = [{ tableName: 'order_details', columnName: 'id', columnType: 'Int64' }];

describe('Metadata load() race', () => {
	it('a stale failing load does not flip loadFailed over a newer successful one', async () => {
		const qs = new DeferredQueryService();
		const m = new Metadata(qs as never);

		const loadA = m.load(); // queries 0,1,2 — will fail
		const loadB = m.load(); // queries 3,4,5 — will succeed

		// Newer load B completes first, populating the catalog.
		qs.resolve(3, columns(orderDetailsRows));
		qs.resolve(4, empty);
		qs.resolve(5, empty);
		await loadB;

		expect(m.loadFailed).toBe(false);
		expect(m.getTable('order_details')).toBeDefined();

		// Older load A now fails — it must not clobber the populated state.
		qs.resolve(0, failed);
		qs.resolve(1, empty);
		qs.resolve(2, empty);
		await expect(loadA).rejects.toThrow();

		expect(m.loadFailed).toBe(false);
		expect(m.getTable('order_details')).toBeDefined();
	});

	it('sets loadFailed when the latest load is the one that fails', async () => {
		const qs = new DeferredQueryService();
		const m = new Metadata(qs as never);

		const load = m.load();
		qs.resolve(0, failed);
		qs.resolve(1, empty);
		qs.resolve(2, empty);
		await expect(load).rejects.toThrow();

		expect(m.loadFailed).toBe(true);
	});
});
