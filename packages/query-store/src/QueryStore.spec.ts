import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryStore } from './QueryStore';
import util from 'util';

const tick = () => new Promise((r) => setTimeout(r, 100));

describe('QueryStore', () => {
	const mockExec = vi.fn();
	const mockSubscription = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();
		mockExec.mockImplementation((q: string) => {
			if (q.startsWith('--col-metadata'))
				return Promise.resolve([{ column_name: 'x', column_type: 'INTEGER' }]);
			if (q.startsWith('--len')) return Promise.resolve([{ length: 5 }]);
			return Promise.resolve([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }]);
		});
	});

	it('should be defined', () => {
		expect(QueryStore).toBeDefined();
	});

	it('should be subscribeable', () => {
		const store = new QueryStore('SELECT 1', mockExec);
		store.subscribe(mockSubscription);

		expect(mockSubscription).toHaveBeenCalledOnce();
	});

	it('should execute a query when accessing the .length property', async () => {
		const store = new QueryStore('SELECT 1', mockExec);
		store.subscribe(mockSubscription);

		// Accessing the property should be enough
		store.proxy.length;

		// let the event loop do its thing and the store hash things out
		await tick();

		expect(store.proxy.length).toBe(5);

		// 1. Initial Subscription
		// 2. Length loading started
		// 3. Length loading finished
		// 4. Column Descriptions become available
		expect(mockSubscription).toHaveBeenCalledTimes(4);
		// 1. Column Metadata
		// 2. Length
		expect(mockExec).toHaveBeenCalledTimes(2);

		// Data was not touched
		// This query should not have fired
		expect(store.loaded).toBe(false);
		expect(store.loading).toBe(false);

		// Length should have finished loading
		expect(store.lengthLoaded).toBe(true);
		expect(store.lengthLoading).toBe(false);
	});

	it('should ensure that 2 queries with the same derivation are distinct', () => {
		const store1 = new QueryStore('SELECT 1;', mockExec, undefined, { disableCache: false });
		const store2 = new QueryStore('SELECT 2;', mockExec, undefined, { disableCache: false });

		const limitedStore1 = store1.limit(0);
		const limitedStore2 = store2.limit(0);

		expect(limitedStore1.text).not.toEqual(limitedStore2.text);
	});

	it('should slice properly', async () => {
		const store = new QueryStore('SELECT 2;', mockExec, undefined, { disableCache: false }).proxy;

		await store.fetch();

		const sliced = store.slice();

		console.error(sliced.length, store.length);
		expect(sliced.length).toEqual(store.length);

		expect(sliced[0]).toEqual(store.proxy[0]);
	});

	describe('Derived Stores', () => {
		describe.each<{ func: keyof QueryStore; args: unknown[] }>([
			{ func: 'where', args: [] },
			{ func: 'agg', args: [{}] },
			{ func: 'limit', args: [5] },
			{ func: 'orderBy', args: [{}] },
			{ func: 'offset', args: [] }
		])('$func', (opts) => {
			it(`should have the property ${opts.func}()`, () => {
				const store = new QueryStore('SELECT 1;', mockExec, undefined, { disableCache: true });
				expect(opts.func in store).toBe(true);
				expect(typeof store[opts.func]).toBe('function');
			});

			it(`should return a new store when using .${opts.func}`, () => {
				const store = new QueryStore('SELECT 1;', mockExec, undefined, { disableCache: true });

				const targetFunc = store[opts.func];
				expect(targetFunc).toBeTypeOf('function');

				const childStore = (targetFunc as CallableFunction)(...opts.args);

				// store !== childStore
				expect(store).not.toEqual(childStore);
				// childStore is a proxy
				expect(util.types.isProxy(childStore)).toBe(true);
			});
			it('should subscribe to derived stores', async () => {
				const store = new QueryStore('SELECT 1;', mockExec, undefined, { disableCache: true });
				const targetFunc = store[opts.func];
				expect(targetFunc).toBeTypeOf('function');

				const childStore = (targetFunc as CallableFunction)(opts.args);
				store.subscribe(mockSubscription);

				childStore.length;

				await tick();

				// 1. Parent Initial Load
				// 2. Parent Metadata
				// 3. Child Initial Load
				// 4. Child Metadata
				// 5. Child Length

				expect(mockSubscription).toBeCalledTimes(5);

				expect(childStore.length).toBe(5);
			});
		});
	});
});
