import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Query } from './Query';
import { sharedPromise } from '../lib/sharedPromise';

const tick = () => new Promise((r) => setTimeout(r, 0));

/** @type {import('./types').MaybePromise<[{rowCount: number}]>} */
let expectedLength = [{ rowCount: -1 }];
/** @type {import('./types').MaybePromise<import('../types/duckdb-wellknown').DescribeResultRow[]>} */
let expectedColumns = [];
/** @type {import('./types').MaybePromise<import('./types').QueryResultRow[]>} */
let expectedData = [];

const mockRunner = vi.fn((q) => {
	if (q.startsWith('---- Length')) {
		return expectedLength;
	}
	if (q.startsWith('---- Columns')) {
		return expectedColumns;
	}
	if (q.startsWith('---- Data')) {
		return expectedData;
	}
});

let testQueryIndex = 0;
let testIdx = 0;

/**
 * @param {string} s
 * @param {import('./types').QueryOpts} opts
 * @returns
 */
const getMockQuery = (s, opts) => {
	return Query.create(s, mockRunner, {
		id: `q-${testQueryIndex++}-${testIdx}`,
		disableCache: true,
		...opts
	});
};

describe('Query', () => {
	beforeEach(() => {
		expectedColumns = [];
		expectedData = [];
		expectedLength = [{ rowCount: -1 }];
		vi.restoreAllMocks();
		testQueryIndex = 0;
		testIdx++;
		console.log(`Beginning ${testIdx}`);
		Query.emptyCache();
	});

	describe('Query Score', () => {
		it('should not be calculated when data has not been fetched, and autoScore is false', () => {
			const q = getMockQuery('SELECT 5', { autoScore: false });

			expect(q.score).toBe(-1);
		});
		it('should be calculated when autoScore is true', async () => {
			const q = getMockQuery('SELECT 5');
			await tick();
			expect(q.score).toBe(0);
		});
		it('should dispatch an event when the score is too large', async () => {
			const colProm = sharedPromise();
			expectedColumns = colProm.promise;
			expectedLength = [{ rowCount: 100 * 100 * 100 }];
			console.log({ expectedColumns, expectedData, expectedLength });
			const q = getMockQuery('SELECT 5');
			const listen = vi.fn();
			q.addEventListener('highScore', listen);
			await tick();
			expect(q.score).toBe(-1);
			expect(listen).not.toHaveBeenCalled();
			colProm.resolve([
				{
					column_name: 'x',
					column_type: 'VARCHAR'
				},
				{
					column_name: 'x',
					column_type: 'VARCHAR'
				},
				{
					column_name: 'x',
					column_type: 'VARCHAR'
				},
				{
					column_name: 'x',
					column_type: 'VARCHAR'
				},
				{
					column_name: 'x',
					column_type: 'VARCHAR'
				}
			]);
			await tick();
			expect(q.score).toBeGreaterThan(10 * 1024 * 1024);
			expect(listen).toHaveBeenCalledWith(q.score, 'highScore');
		});
	});

	describe('Data Volume', () => {
		it('should process result sets of 10k rows in <250ms', async () => {
			console.log('xx');
			const rows = Array(10 * 1000)
				.fill(null)
				.map(() => ({
					str: 'Hi',
					num: Math.random(),
					bool: Math.random() > 0.5
				}));
			/** @type {import('../types/duckdb-wellknown').DescribeResultRow[]} */
			const columns = [
				{ column_name: 'str', column_type: 'VARCHAR' },
				{ column_name: 'num', column_type: 'INT' },
				{ column_name: 'bool', column_type: 'BOOL' }
			];
			const length = [{ rowCount: 10 * 1000 }];

			expectedColumns = columns;
			expectedLength = length;
			expectedData = rows;

			const query = getMockQuery('SELECT 5');

			const before = performance.now();
			await query.fetch();
			const after = performance.now();

			expect(query.length).toBe(10 * 1000);
			expect(after - before).toBeLessThan(250);
		});
		it('should process result sets of 100k rows in <250ms', async () => {
			const rows = Array(1000 * 1000)
				.fill(null)
				.map(() => ({
					str: 'Hi',
					num: Math.random(),
					bool: Math.random() > 0.5
				}));
			/** @type {import('../types/duckdb-wellknown').DescribeResultRow[]} */
			const columns = [
				{ column_name: 'str', column_type: 'VARCHAR' },
				{ column_name: 'num', column_type: 'INT' },
				{ column_name: 'bool', column_type: 'BOOL' }
			];
			const length = [{ rowCount: 1000 * 1000 }];

			expectedColumns = columns;
			expectedLength = length;
			expectedData = rows;

			const before = performance.now();
			const query = getMockQuery('');
			await query.fetch();
			const after = performance.now();

			console.log(`Took ${(after - before).toFixed(2)}`);
			expect(query.length).toBe(1000 * 1000);
			expect(after - before).toBeLessThan(250);
		});
	});

	describe('Legacy Compatibility', () => {
		it('should allow id to be the 3rd parameter', () => {
			expect(Query.create('HI', mockRunner, 'Test ID', {}).id).toBe('Test ID');
		});
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

		describe('Reactive Variant', () => {
			it('should return a resolved query promise (w/o artificial delay)', async () => {
				const { updater: reactiveQuery } = Query.reactive(mockRunner, 'SELECT -1');
				const q = reactiveQuery('SELECT 5');

				expect(q).toBeInstanceOf(Promise);

				const $q = await q;
				expect(Query.isQuery($q)).toBe(true);
			});
			it('should return distinct query values when called multiple times', async () => {
				const { updater: reactiveQuery } = Query.reactive(mockRunner, 'SELECT -1');
				const q = await reactiveQuery('SELECT 5');
				const q2 = await reactiveQuery('SELECT 6');

				expect(Query.isQuery(q)).toBe(true);
				expect(Query.isQuery(q2)).toBe(true);

				// Not equal
				expect(q === q2).toBe(false);
				expect(q.hash).not.toEqual(q2.hash);
			});
			it('should return the same query values when called multiple times with the same query', async () => {
				const { updater: reactiveQuery } = Query.reactive(mockRunner, 'SELECT -1');
				const q = await reactiveQuery('SELECT 5');
				const q2 = await reactiveQuery('SELECT 5');

				expect(Query.isQuery(q)).toBe(true);
				expect(Query.isQuery(q2)).toBe(true);

				// Not equal
				expect(q).toBe(q2);
				expect(q.hash).toEqual(q2.hash);
			});
			it('should return a still loading query only if the threshold is passed', async () => {
				const { updater: reactiveQuery } = Query.reactive(mockRunner, 'SELECT -1');
				expectedData = [{ x: 1 }];
				const loadDelay = 100;
				const initialQuery = await reactiveQuery('SELECT 5', loadDelay);

				expect(initialQuery[0].x).toBe(1);

				const dataPromise = sharedPromise();
				expectedData = dataPromise.promise;
				const before = performance.now();
				const secondQuery = await reactiveQuery('SELECT 10');
				const after = performance.now();
				expect(after - before).toBeGreaterThanOrEqual(loadDelay);
				expect(secondQuery.loading).toBe(true);
				dataPromise.resolve([{ x: 2 }]);
				await tick();
				expect(secondQuery.loading).toBe(false);
				expect(secondQuery[0].x).toBe(2);
			});
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
			expectedColumns = [{ column_name: 'test', column_type: 'BOOLEAN' }];
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
			const p = sharedPromise();
			expectedData = p.promise;
			const q = getMockQuery('SELECT 1');
			expect(q.dataLoading).toBe(false);
			q[0];
			expect(q.dataLoading).toBe(true);
			p.resolve([]);
		});
		it.each(Query.ProxyFetchTriggers)('should fetch when "%s" property is accessed', (trigger) => {
			const p = sharedPromise();
			expectedData = p.promise;
			const q = getMockQuery('SELECT 1');
			expect(q.dataLoading).toBe(false);
			q.value[trigger];
			expect(q.dataLoading).toBe(true);
			p.resolve([]);
		});
	});

	describe('Global Loading State', () => {
		it('should report that no queries are loading when no queries have been created', () => {
			expect(Query.QueriesInFlight).toBe(false);
		});
		it('should report that no queries are loading when queries have been created, but not loaded', () => {
			const q = getMockQuery('SELECT 1');
			const q2 = getMockQuery('SELECT 2');
			expect(Query.QueriesInFlight).toBe(false);
			expect(q.loading).toBe(false);
			expect(q2.loading).toBe(false);
		});
		it('should report that some queries are loading when one query is currently fetching', async () => {
			const onQueryStart = vi.fn();
			const onQueryEnd = vi.fn();
			Query.addEventListener('inFlightQueryStart', onQueryStart);
			Query.addEventListener('inFlightQueryEnd', onQueryEnd);

			const mockDataPromise = sharedPromise();
			expectedData = mockDataPromise.promise;
			const q = getMockQuery('SELECT 5');
			q.fetch();
			expect(Query.QueriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(true);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();
			mockDataPromise.resolve([]);
			await tick();
			expect(Query.QueriesInFlight).toBe(false);
			expect(q.dataLoading).toBe(false);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).toHaveBeenCalledOnce();

			Query.removeEventListener('inFlightQueryStart', onQueryStart);
			Query.removeEventListener('inFlightQueryEnd', onQueryEnd);
		});
		it('should report that some queries are loading when multiple queries are currently fetching', async () => {
			const onQueryStart = vi.fn();
			const onQueryEnd = vi.fn();
			Query.addEventListener('inFlightQueryStart', onQueryStart);
			Query.addEventListener('inFlightQueryEnd', onQueryEnd);

			const mockDataPromise = sharedPromise();
			const mockDataPromise2 = sharedPromise();
			const q = getMockQuery('SELECT 5');
			const q2 = getMockQuery('SELECT 5');
			expectedData = mockDataPromise.promise;
			q.fetch();
			// q1 is in flight
			expect(Query.QueriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(true);
			expect(q2.dataLoading).toBe(false);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();

			expectedData = mockDataPromise2.promise;
			q2.fetch();
			// q1 and q2 are in flight
			expect(Query.QueriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(true);
			expect(q2.dataLoading).toBe(true);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();

			mockDataPromise.resolve([]);
			await tick();
			// q1 resolved, q2 in flight
			expect(Query.QueriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(false);
			expect(q2.dataLoading).toBe(true);
			mockDataPromise2.resolve([]);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();

			await tick();
			// q1 resolved, q2 resolved
			expect(Query.QueriesInFlight).toBe(false);
			expect(q.dataLoading).toBe(false);
			expect(q2.dataLoading).toBe(false);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).toHaveBeenCalledOnce();
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
			const q = getMockQuery('SELECT 5', { id: 'I SEE YOU' });
			const subscriber = vi.fn(console.log);
			let i = 0;

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.lengthLoaded).toBe(false);
				expect(v.lengthLoading).toBe(true);
			});
			q.subscribe(subscriber); // first call
			await tick();
			expect(subscriber).toHaveBeenCalledOnce();

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.lengthLoaded).toBe(true);
				expect(v.lengthLoading).toBe(false);
				expect(v.length).toBe(5);
			});
			expect(subscriber).toHaveBeenCalledOnce();
			lengthSharedPromise.resolve([{ rowCount: 5 }]); // second call??
			await tick();
			expect(subscriber).toHaveBeenCalledTimes(2); /* Length load start, length load end */
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
			const sub = vi.fn();
			q.on('dataReady', sub);
			await q.fetch();
			expect(sub).toHaveBeenCalledWith(undefined, 'dataReady');
		});
		it('should respect .off', async () => {
			const q = getMockQuery('');
			const sub = vi.fn();
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
