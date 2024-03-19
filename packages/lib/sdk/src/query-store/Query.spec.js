import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Query } from './Query';
import { sharedPromise } from '../lib/sharedPromise';

const tick = () => new Promise((r) => setTimeout(r, 0));

/** @type {import('./types').MaybePromise<[import('../types/duckdb-wellknown').DescribeResultRow]>} */
let expectedLength = [{ rowCount: -1 }];
/** @type {import('./types').MaybePromise<import('./types').QueryResultRow>} */
let expectedColumns = [];
/** @type {import('./types').MaybePromise<import('./types').QueryResultRow>} */
let expectedData = [];

const mockRunner = vi.fn((q) => {
	if (q.startsWith('---- Length')) return expectedLength;
	if (q.startsWith('---- Columns')) return expectedColumns;
	if (q.startsWith('---- Data')) return expectedData;
});

let testQueryIndex = 0;

/**
 *
 * @param {string} s
 * @param {import('./types').QueryOpts} opts
 * @returns
 */
const getMockQuery = (s, opts) => {
	return Query.create(s, mockRunner, { id: `q-${testQueryIndex++}`, disableCache: true, ...opts });
};

describe('Query', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		testQueryIndex = 0;
	});

	describe('Legacy Compatibility', () => {
		it('should allow id to be the 3rd parameter', () => {
			expect(Query.create('HI', mockRunner, 'Test ID', {}).id).toBe('Test ID');
		});

		Query.create('select 1', mockRunner, 'query_id');
		Query.create('select 1', mockRunner, { id: 'query_id' });
	});

	describe('Factory Pattern', () => {
		it('should warn when directly using new', () => {
			const spy = vi.spyOn(console, 'warn');
			new Query('SELECT 1', mockRunner);
			expect(spy).toHaveBeenCalled();
		});
		it('should throw when query string is not a string or QueryBuilder', () => {
			expect(() => getMockQuery(null)).toThrowError('Refusing to create Query');
		});
	});

	describe('Store Contract', () => {
		it('should be subscriptable', () => {
			const q = getMockQuery('SELECT 1');
			expect(q).toBeDefined();
			expect(q.subscribe).toBeTypeOf('function');
			const testSub = vi.fn();
			expect(q.subscribe(testSub)).toBeTypeOf('function');
		});
		it('should correctly publish to subscribers', () => {
			const q = getMockQuery('SELECT 1');
			const testSubs = [vi.fn(), vi.fn(), vi.fn()];
			const unsubs = testSubs.map(q.subscribe);
			unsubs.forEach((unsub) => expect(unsub).toBeTypeOf('function'));

			testSubs.forEach((fn) => {
				expect(fn).toHaveBeenCalledTimes(1);
			});
		});
		it('should be unsubscribable', () => {
			const q = getMockQuery('SELECT 1');
			const testSubs = [vi.fn(), vi.fn(), vi.fn()];
			const unsubs = testSubs.map(q.subscribe);

			unsubs.forEach((unsub) => unsub());
			// @ts-expect-error Accessing a protected function
			q.publish();

			testSubs.forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
		});
		it('should publish infrequently', async () => {
			expectedLength = [{ rowCount: 100 }];
			expectedColumns = [{ column_name: 'test' }];
			expectedData = Promise.resolve([{ test: 'hi' }]);

			const q = getMockQuery('SELECT 1');
			const testSubs = [vi.fn(), vi.fn(), vi.fn()];

			testSubs.map(q.subscribe);

			q.fetch();
			testSubs.forEach((fn) => expect(fn).toHaveBeenCalledTimes(2));
			expect(q.dataLoaded).toBe(false);
			await tick();
			testSubs.forEach((fn) => expect(fn).toHaveBeenCalledTimes(3));
			expect(q.dataLoaded).toBe(true);

			expect(q.length).toBe(100);
			expect(q.columns[0].column_name).toBe('test');
			expect(q[0].test).toBe('hi');
		});
	});

	describe('Type Narrowing', () => {
		it('should accept a Query', () => {
			expect(Query.isQuery(getMockQuery('SELECT 1'))).toBe(true);
		});
		it('should fail a plain object', () => {
			expect(Query.isQuery({})).toBe(false);
		});
		it('should fail a class that is pretending', () => {
			class NotQuery {
				#isQuery = true;
			}
			expect(Query.isQuery(new NotQuery())).toBe(false);
		});
	});

	describe('Implicit Fetching', () => {
		it('should fetch when a numeric property is accessed', () => {
			const q = getMockQuery('SELECT 1');
			expect(q.dataLoading).toBe(false);
			q[0];
			expect(q.dataLoading).toBe(true);
		});
		it('should fetch when special properties are accessed', () => {
			Query.ProxyFetchTriggers.forEach((trigger) => {
				const q = getMockQuery('SELECT 1');
				expect(q.dataLoading).toBe(false);
				q.value[trigger];
				expect(q.dataLoading).toBe(true);
			});
		});
	});

	describe('Query/Array Masquarade', () => {
		it('it should pass Array.isArray', () => {
			const q = getMockQuery('SELECT 1');

			expect(Array.isArray(q)).toBe(true);
		});
		it('it should pass Query.isQuery', () => {
			const q = getMockQuery('SELECT 1');

			expect(q.value).toBeDefined();
			expect(Query.isQuery(q)).toBe(true);
		});
		it('published value should pass Array.isArray', () => {
			const q = getMockQuery('SELECT 1');
			/** @type {import('./Query').QueryValue} */
			let publishedValue;
			q.subscribe((v) => {
				publishedValue = v;
			})();

			expect(publishedValue.value).toBeDefined();
			expect(Array.isArray(publishedValue)).toBe(true);
		});
		it('published value should pass Query.isQuery', () => {
			const q = getMockQuery('SELECT 1');
			/** @type {import('./Query').QueryValue} */
			let publishedValue;
			q.subscribe((v) => {
				publishedValue = v;
			})();

			expect(publishedValue.value).toBeDefined();
			expect(Query.isQuery(publishedValue)).toBe(true);
		});
		it('should pass echarts method', () => {
			const q = getMockQuery('SELECT 1');
			expect(Object.prototype.toString.call(q)).toBe('[object Array]');
		});
		it('should iterate through rows by default', () => {
			const rows = [{ x: 1 }, { x: 2 }];
			const q = getMockQuery('', { initialData: rows });

			// Variety of iteration methods
			let i = 0;
			for (const v of q) {
				if (i > rows.length) throw new Error('Iteration went out of bounds');
				expect(v).toEqual(rows[i++]);
			}

			i = 0;
			for (const idx in q) {
				if (i > rows.length) throw new Error('Iteration went out of bounds');
				expect(q[idx]).toEqual(rows[i++]);
			}

			i = 0;
			q.forEach((v) => {
				if (rows.length > 2) throw new Error('Iteration went out of bounds');
				expect(v).toEqual(rows[i++]);
			});

			for (let idx = 0; idx < rows.length; idx++) {
				expect(q[idx]).toEqual(rows[idx]);
			}
		});
	});

	describe('Metadata', () => {
		describe('Columns', () => {
			it('should be fetched when creating a store', () => {
				getMockQuery('SELECT 5');
				expect(mockRunner).toHaveBeenCalledTimes(2); // once for length, once for meta
			});
			it('should not be fetched when creating a store with knownColumns', () => {
				getMockQuery('SELECT 5', { knownColumns: [] });
				expect(mockRunner).toHaveBeenCalledTimes(1); // once for length
			});
			it('should put the results of the metadata query into the columns fields', () => {
				const columns = [{ column_name: '5', column_type: 'INTEGER', null: 'YES' }];
				expectedColumns = columns;
				const q = getMockQuery('SELECT 5');
				expect(q.columns).toEqual(columns);
			});
		});
		describe('Length', () => {
			it('should be fetched when creating a store', () => {
				expectedLength = [{ rowCount: 5 }];
				const q = getMockQuery('SELECT 5');
				expect(q.length).toBe(5);
			});
			it('should be inferred when given initial data', () => {
				const q = getMockQuery('SELECT 5', { initialData: [{ 5: 5 }] });
				expect(q.length).toBe(1);
			});
		});
	});

	describe('Subscription Lifecycle', () => {
		it('should publish when fetching metadata', async () => {
			// setup
			const metaSharedPromise = sharedPromise();
			expectedColumns = metaSharedPromise.promise; // use a shared promise to control how long the query takes
			const q = getMockQuery('SELECT 5');
			const subscriber = vi.fn();
			let i = 0;

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.columnsLoaded).toBe(false);
				expect(v.columnsLoading).toBe(true);
			});
			q.subscribe(subscriber);
			await tick();

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.columnsLoaded).toBe(true);
				expect(v.columnsLoading).toBe(false);
			});
			metaSharedPromise.resolve([]);

			await tick();
			await tick();
			expect(subscriber).toHaveBeenCalledTimes(2); // cols loading + loaded + length pub
			expect(i).toBe(2);
		});

		it('should publish when fetching length', async () => {
			const lengthSharedPromise = sharedPromise();
			expectedLength = lengthSharedPromise.promise;
			const q = getMockQuery('SELECT 5');
			const subscriber = vi.fn();
			let i = 0;

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.lengthLoaded).toBe(false);
				expect(v.lengthLoading).toBe(true);
			});
			q.subscribe(subscriber);
			await tick();

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.lengthLoaded).toBe(true);
				expect(v.lengthLoading).toBe(false);
				expect(v.length).toBe(5);
			});
			lengthSharedPromise.resolve([{ rowCount: 5 }]);
			await tick();
			await tick();
			expect(subscriber).toHaveBeenCalledTimes(3); /* Length load start, length load end */
			expect(i).toBe(2);
		});
	});

	describe('QueryBuilder interface', () => {
		it("should pass known columns when the derived query doesn't have different selects", () => {
			expectedColumns = [];
			const initial = getMockQuery('SELECT 1');
			const filtered = initial.where('1 = 1');
			expect(filtered.columns).toEqual(expectedColumns);
			expect(filtered.columns).toEqual(initial.columns); // referential equality
			/*
				One columns fetch
				Two length fetches
			*/
			expect(mockRunner).toHaveBeenCalledTimes(3);
		});
	});

	describe('EventEmitter interface', () => {
		it('should emit dataReady when done fetching data', async () => {
			const q = getMockQuery('');
			const sub = vi.fn().mockImplementation(console.log);
			q.on('dataReady', sub);
			await q.fetch();
			expect(sub).toHaveBeenCalled();
		});
		it('should respect .off', async () => {
			const q = getMockQuery('');
			const sub = vi.fn().mockImplementation(console.log);
			q.on('dataReady', sub);
			q.off('dataReady', sub);
			await q.fetch();
			expect(sub).not.toHaveBeenCalled();
		});
		it('should emit an error event when a query fails', async () => {
			const innerError = new Error('Hello World');
			expectedColumns = Promise.reject(innerError);
			let output;
			const sub = vi.fn().mockImplementation((v) => (output = v));
			try {
				const q = getMockQuery('');
				q.on('error', sub);
			} catch {
				/* Ignore */
			}
			await tick();
			expect(sub).toHaveBeenCalledOnce();
			expect(output).toEqual(innerError); // Check that the error bubbled properly
		});
	});
});
