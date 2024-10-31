import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Query } from './Query';
import { sharedPromise } from '../../lib/sharedPromise';
import { InputStore } from '../../utils/inputs/InputStore.js';
const tick = (timeout = 0) => new Promise((r) => setTimeout(r, timeout));

/** @type {import('../types').MaybePromise<[{rowCount: number}]>} */
let expectedLength = [{ rowCount: -1 }];
/** @type {import('../types').MaybePromise<import('../../types/duckdb-wellknown').DescribeResultRow[]>} */
let expectedColumns = [];
/** @type {import('../types').MaybePromise<import('../types').QueryResultRow[]>} */
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

let inputs;
beforeEach(() => {
	inputs = new InputStore();
	expectedColumns = [];
	expectedData = [];
	expectedLength = [{ rowCount: -1 }];
	vi.restoreAllMocks();
	testQueryIndex = 0;
	Query.emptyCache();
	Query.resetInFlightQueries();
	testIdx += 1;
});
afterEach(() => {
	vi.useRealTimers(); // just to make sure
});
/**
 * @param {import('../types').QueryReactivityOpts} reactiveOpts
 * @param {import('../types').QueryOpts} opts
 * @returns
 */
const getMockQuery = (reactiveOpts, opts) => {
	return Query.create(
		`q-${testQueryIndex++}-${testIdx}`,
		{
			callback: () => {},
			dagManager: inputs,
			execFn: mockRunner,
			...reactiveOpts
		},
		{
			disableCache: true,
			...opts
		}
	);
};

describe('Query', () => {
	describe('Cache Busting', () => {
		it('should not grow the cache when disableCache is set', () => {
			getMockQuery({}, { disableCache: true })(() => '1');
			getMockQuery({}, { disableCache: true })(() => '2');
			getMockQuery({}, { disableCache: true })(() => '3s');
			expect(Query.cacheSize).toBe(0);
		});
		it('should cache normally for a few queries', () => {
			getMockQuery({}, { disableCache: false })(() => '1');
			getMockQuery({}, { disableCache: false })(() => '2');
			getMockQuery({}, { disableCache: false })(() => '3');
			expect(Query.cacheSize).toBe(3);
		});
		it('should not cache when CacheMaxScore is 0', () => {
			Query.CacheMaxScore = 0;
			expectedColumns = [
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
			];

			getMockQuery({}, { disableCache: false })(() => '1');
			getMockQuery({}, { disableCache: false })(() => '2');
			getMockQuery({}, { disableCache: false })(() => '3');
			expect(Query.cacheSize).toBe(0);
		});
		it('should rotate the cache when CacheMaxScore is non-zero', () => {
			Query.CacheMaxScore = 200;
			expectedColumns = [
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
			];

			getMockQuery({}, { disableCache: false })(() => '1');
			getMockQuery({}, { disableCache: false })(() => '2');
			getMockQuery({}, { disableCache: false })(() => '3');
			expect(Query.cacheSize).toBe(1);
		});
	});

	describe('Query Score', () => {
		it('should not be calculated when data has not been fetched, and autoScore is false', () => {
			let q;
			getMockQuery({ callback: (x) => (q = x) }, { autoScore: false })(() => '1234');
			expect(q.score).toBe(-1);
		});
		it('should be calculated when autoScore is true', () => {
			let q;
			getMockQuery({ callback: (x) => (q = x) }, { autoScore: true })(() => '1234');
			expect(q.score).toBe(0);
		});
		it('should dispatch an event when the score is too large', async () => {
			const colProm = sharedPromise();
			expectedColumns = colProm.promise;
			expectedLength = [{ rowCount: 100 * 100 * 100 }];
			let q;
			getMockQuery({ callback: (x) => (q = x) }, { autoScore: true })(() => '1234');
			const listen = vi.fn();
			q.addEventListener('highScore', listen);
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
			await q.fetch();
			expect(q.score).toBeGreaterThan(10 * 1024 * 1024);
			expect(listen).toHaveBeenCalledWith(q.score, 'highScore');
		});
	});

	describe('Data Volume', () => {
		it('should process result sets of 10k rows in <250ms', async () => {
			const rows = Array(10 * 1000)
				.fill(null)
				.map(() => ({
					str: 'Hi',
					num: Math.random(),
					bool: Math.random() > 0.5
				}));
			/** @type {import('../../types/duckdb-wellknown').DescribeResultRow[]} */
			const columns = [
				{ column_name: 'str', column_type: 'VARCHAR' },
				{ column_name: 'num', column_type: 'INTEGER' },
				{ column_name: 'bool', column_type: 'BOOLEAN' }
			];
			const length = [{ rowCount: 10 * 1000 }];

			expectedColumns = columns;
			expectedLength = length;
			expectedData = rows;

			let query;
			getMockQuery({ callback: (x) => (query = x) }, {})(() => '1234');

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
			/** @type {import('../../types/duckdb-wellknown').DescribeResultRow[]} */
			const columns = [
				{ column_name: 'str', column_type: 'VARCHAR' },
				{ column_name: 'num', column_type: 'INTEGER' },
				{ column_name: 'bool', column_type: 'BOOLEAN' }
			];
			const length = [{ rowCount: 1000 * 1000 }];

			expectedColumns = columns;
			expectedLength = length;
			expectedData = rows;

			const before = performance.now();
			let query;
			getMockQuery({ callback: (x) => (query = x) }, {})(() => '1234');

			await query.fetch();
			const after = performance.now();

			expect(query.length).toBe(1000 * 1000);
			expect(after - before).toBeLessThan(250);
		});
	});

	describe('Factory Pattern', () => {
		it('should warn when directly using new', () => {
			const spy = vi.spyOn(console, 'warn');
			new Query('SELECT 1', mockRunner);
			expect(spy).toHaveBeenCalled();
		});
		it('should throw when query string is not a string or QueryBuilder', () => {
			expect(() => getMockQuery({}, {})()).toThrow();
		});

		describe('Dependency Tracking', () => {
			it('should be created with a dag node', () => {
				/** @type {import ('./Query.js').QueryValue} */
				let value;
				getMockQuery({ execFn: mockRunner, callback: (v) => (value = v) })(() => '');

				expect(value.__dag).toBeDefined();
			});
			it("should execute it's callback when the text is updated", () => {
				const callback = vi.fn();
				const q = getMockQuery({ callback });
				q(() => `${inputs.hello}`);
				expect(callback).toHaveBeenCalledOnce();
			});
			it("should keep track of it's dependencies when they exist in the provided text", () => {
				/** @type {import("./Query.js").QueryValue<any>} */
				let v;
				const q = getMockQuery({ callback: (vv) => (v = vv) });
				q(() => `${inputs.hello}`);
				expect(v.__dag.parents.size).toBe(1);
			});
			it("should properly update the query text when it's dependencies change", () => {
				/** @type {import("./Query.js").QueryValue<any>} */
				let v;
				const q = getMockQuery({
					callback: (vv) => {
						v = vv;
					}
				});
				inputs.hello.value = '5';
				q(() => `${inputs.hello.value}`);
				expect(v.__dag.parents.size).toBe(1);
				expect(v.originalText).toBe('5');

				inputs.hello.value = 'new';
				expect(v.originalText).toBe('new');
			});
		});

		describe('Reactivity', () => {
			// 	// TODO: Try to use the factory with derived queries
			// });
			describe('change indexing', () => {
				it('should not provide outdated results', async () => {
					/*
						This test is a little hard to read (and reason about)

						We are shooting for this behavior:
							- Some query is executed
							- A filter is updated, but takes a while to load
							- Before that filtered query is complete, the user unsets the filter
							- The original value is now used, because it is cached
							- When the modified query finishes execution, it is not used because it is outdated

						It is important that the query take fewer than 500ms, because if it takes longer, it is
						used even if it is not complete (to give the user better feedback)
					*/
					vi.useFakeTimers();
					/** @type {import('..').QueryValue} */
					let value;
					const react = getMockQuery(
						{
							callback: (v) => {
								console.log('Updating value', v.originalText);
								v.fetch();
								value = v;
								// console.log(expectedData, [...v])
							},
							loadGracePeriod: 0
						},
						{
							disableCache: false
						}
					);

					expectedData = [{ i: 0 }];
					react(() => 'SELECT 1'); // initial state
					expect(value.ready).toBe(true);
					expect(value.originalText).toBe('SELECT 1');
					/*
						At this point, the query has finished loading with the first result.
						It should contain [{i:0}]
						We are now updating the query, simulating a long-running query
					*/
					const p = sharedPromise();
					expectedData = p.promise;
					react(() => 'SELECT 2'); // This update will take some time

					expect(value.originalText).toBe('SELECT 1');
					await vi.advanceTimersByTimeAsync(200); // This is the threshold for incomplete queries to get passed
					/* Confirm that we are not yet looking at the long running query */
					expect(value.originalText).toBe('SELECT 1');

					/* Switch back to the first query */
					react(() => 'SELECT 1');
					expect(value.originalText).toBe('SELECT 1');
					expect(value.ready).toBe(true);

					/* Previous query "finishes" */
					p.resolve([{ i: 1 }]);
					// Ensure that the promise loop ticks
					await vi.advanceTimersToNextTimerAsync();

					/* Ensure that we haven't switched back to the long-running query */
					expect(value.originalText).toBe('SELECT 1');
					expect(value.ready).toBe(true);
					expect(value[0].i).toBe(0);

					/* This query should be ready to go */
					react(() => 'SELECT 2');
					expect(value.originalText).toBe('SELECT 2');
					expect(value[0].i).toBe(1);
				});
			});
			it('should produce distinct queries when called multiple times', async () => {
				let values = new Set();

				const react = getMockQuery(
					{
						callback: (v) => {
							values.add(v);
						},
						loadGracePeriod: 0
					},
					{}
				);
				react(() => 'SELECT 5');
				await tick();
				react(() => 'SELECT 3');
				await tick();
				const [first, second] = values.values();

				expect(Query.isQuery(first)).toBe(true);
				expect(Query.isQuery(second)).toBe(true);
				expect(first === second).toBe(false);
			});
			it('should return a pending query when it takes more than 500ms to execute', async () => {
				vi.useFakeTimers();
				// Test initial state (sync fetch)
				/** @type {import('..').QueryValue} */
				let value;
				const react = getMockQuery(
					{
						callback: (v) => {
							value = v;
						},
						loadGracePeriod: 0
					},
					{}
				);
				react(() => `SELECT 1`);
				const p = sharedPromise();
				expectedData = p.promise;
				react(() => `SELECT 2`);
				await vi.advanceTimersByTimeAsync(499);
				expect(value.loading).toBeFalsy();
				await vi.advanceTimersByTimeAsync(1);
				expect(value.loading).toBeTruthy();
				vi.clearAllTimers();
			});
			it('should return a finalized query when it takes less than 500 to execute', async () => {
				vi.useFakeTimers();

				// Test initial state (sync fetch)
				let value;
				const react = getMockQuery(
					{
						callback: (v) => {
							value = v;
						},
						loadGracePeriod: 0
					},
					{}
				);

				expectedData = [{ x: 1 }];
				react(() => `SELECT 2`);
				await vi.advanceTimersByTimeAsync(250);
				expect(value.loading, 'Query should not be loading').toBe(false);

				vi.clearAllTimers();
			});
			it('should play nicely with reactivity', async () => {
				vi.useFakeTimers();
				const updateTracker = vi.fn();

				let value;
				const react = getMockQuery(
					{
						callback: (v) => {
							updateTracker();
							value = v;
						},
						loadGracePeriod: 0
					},
					{}
				);

				expectedData = [{ state: 'Iniital' }];
				react(() => 'SELECT 1');

				expect(value.loading).toBe(false);
				expect(updateTracker).toHaveBeenCalledTimes(1);

				const p = sharedPromise();
				expectedData = p.promise;

				react(() => 'SELECT 2');
				expect(updateTracker).toHaveBeenCalledTimes(1);
				// At this point the second query has not yet finished

				expect(value.loading).toBe(false);
				await vi.advanceTimersToNextTimerAsync();
				// We've now let the
				expect(updateTracker).toHaveBeenCalledTimes(2);
				expect(value.loading).toBe(true); // value has changed
				expect(value[0]).toBeUndefined();
				p.resolve([{ x: 1 }]);
				await vi.advanceTimersToNextTimerAsync();
				expect(value[0].x).toBe(1);
				expect(updateTracker).toHaveBeenCalledTimes(2);

				vi.clearAllTimers();
			});
		});
	});

	describe('Store Contract', () => {
		it('should be subscriptable', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');

			expect(q).toBeDefined();
			expect(q.subscribe).toBeTypeOf('function');
			const testSub = vi.fn();
			expect(q.subscribe(testSub)).toBeTypeOf('function');
		});
		it('should correctly publish to subscribers', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			const testSubs = [vi.fn(), vi.fn(), vi.fn()];
			const unsubs = testSubs.map(q.subscribe);
			unsubs.forEach((unsub) => expect(unsub).toBeTypeOf('function'));

			testSubs.forEach((fn) => {
				expect(fn).toHaveBeenCalledTimes(1);
			});
		});
		it('should be unsubscribable', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
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

			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			const testSubs = [vi.fn(), vi.fn(), vi.fn()];

			testSubs.map(q.subscribe);
			testSubs.forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
			q.fetch();
			testSubs.forEach((fn) => expect(fn).toHaveBeenCalledTimes(2));
			expect(q.dataLoaded).toBe(false);
			// We are awaiting the resolved promise from expectedData, which pushes us to the next event loop run
			// Using fake timers causes this all to hang for some reason. It isn't clear why, so we use tick instead
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
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			expect(Query.isQuery(q)).toBe(true);
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
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			expect(q.dataLoading).toBe(false);
			q[0];
			expect(q.dataLoading).toBe(true);
			p.resolve([]);
		});
		it.each(Query.ProxyFetchTriggers)('should fetch when "%s" property is accessed', (trigger) => {
			const p = sharedPromise();
			expectedData = p.promise;
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			expect(q.dataLoading).toBe(false);
			q.value[trigger];
			expect(q.dataLoading).toBe(true);
			p.resolve([]);
		});
	});

	describe('Global Loading State', () => {
		it('should report that no queries are loading when no queries have been created', () => {
			expect(Query.queriesInFlight).toBe(false);
		});
		it('should report that no queries are loading when queries have been created, but not loaded', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			let q2;
			getMockQuery(
				{
					callback: (v) => (q2 = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 2');
			expect(Query.queriesInFlight).toBe(false);
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
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			q.fetch();
			expect(Query.queriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(true);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();
			mockDataPromise.resolve([]);
			await tick();
			expect(Query.queriesInFlight).toBe(false);
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
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			let q2;
			getMockQuery(
				{
					callback: (v) => (q2 = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 2');
			expectedData = mockDataPromise.promise;
			q.fetch();
			// q1 is in flight
			expect(Query.queriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(true);
			expect(q2.dataLoading).toBe(false);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();

			expectedData = mockDataPromise2.promise;
			q2.fetch();
			// q1 and q2 are in flight
			expect(Query.queriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(true);
			expect(q2.dataLoading).toBe(true);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();

			mockDataPromise.resolve([]);
			await tick();
			// q1 resolved, q2 in flight
			expect(Query.queriesInFlight).toBe(true);
			expect(q.dataLoading).toBe(false);
			expect(q2.dataLoading).toBe(true);
			mockDataPromise2.resolve([]);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).not.toHaveBeenCalled();

			await tick();
			// q1 resolved, q2 resolved
			expect(Query.queriesInFlight).toBe(false);
			expect(q.dataLoading).toBe(false);
			expect(q2.dataLoading).toBe(false);
			expect(onQueryStart).toHaveBeenCalledOnce();
			expect(onQueryEnd).toHaveBeenCalledOnce();
		});
	});

	describe('Query initial state handling', () => {
		it('should not execute any queries if provided with initial state', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{
					initialData: [],
					knownColumns: [{ column_name: 'x', column_type: 'VARCHAR', nullable: true }]
				}
			)(() => 'SELECT 1');

			expect(mockRunner).not.toHaveBeenCalled();
			expect(q.dataLoaded).toBe(true);
			expect(q.lengthLoaded).toBe(true);
			expect(q.length).toBe(0);
		});
		it('should not execute any queries if initialData provided and noResolve=true', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{
					initialData: [],
					noResolve: true
				}
			)(() => 'SELECT 1');

			expect(mockRunner).not.toHaveBeenCalled();
			expect(q.dataLoading).toBe(false);
			expect(q.lengthLoading).toBe(false);
			expect(q.columnsLoading).toBe(false);
		});
	});

	describe('Query/Array Masquarade', () => {
		it('it should pass Array.isArray', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{
					initialData: [],
					knownColumns: [{ column_name: 'x', column_type: 'VARCHAR', nullable: true }]
				}
			)(() => 'SELECT 1');

			expect(Array.isArray(q)).toBe(true);
		});
		it('it should pass Query.isQuery', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');

			expect(q.value).toBeDefined();
			expect(Query.isQuery(q)).toBe(true);
		});
		it('published value should pass Array.isArray', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');

			/** @type {import('./Query').QueryValue} */
			let publishedValue;
			q.subscribe((v) => {
				publishedValue = v;
			})();

			expect(publishedValue.value).toBeDefined();
			expect(Array.isArray(publishedValue)).toBe(true);
		});
		it('published value should pass Query.isQuery', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			/** @type {import('./Query').QueryValue} */
			let publishedValue;
			q.subscribe((v) => {
				publishedValue = v;
			})();

			expect(publishedValue.value).toBeDefined();
			expect(Query.isQuery(publishedValue)).toBe(true);
		});
		it('should pass echarts method', () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			expect(Object.prototype.toString.call(q)).toBe('[object Array]');
		});
		it('should iterate through rows by default', () => {
			const rows = [{ x: 1 }, { x: 2 }];
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{ initialData: rows }
			)(() => 'SELECT 1');

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
		describe('basic array usages', () => {
			it('filter', () => {
				const rows = [{ x: 1 }, { x: 2 }];
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{ initialData: rows }
				)(() => 'SELECT 1');
				expect(q.filter((r) => r.x === 1)).toEqual([rows[0]]);
			});
			it('map', () => {
				const rows = [{ x: 1 }, { x: 2 }];
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{ initialData: rows }
				)(() => 'SELECT 1');
				expect(q.map((r) => r.x)).toEqual([1, 2]);
			});
		});
	});

	describe('Metadata', () => {
		describe('Columns', () => {
			it('should be fetched when creating a store', () => {
				getMockQuery(
					{
						callback: () => {},
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				expect(mockRunner).toHaveBeenCalledTimes(2); // once for length, once for meta
			});
			it('should not be fetched when creating a store with knownColumns', () => {
				getMockQuery(
					{
						callback: () => {},
						loadGracePeriod: 0
					},
					{ knownColumns: [] }
				)(() => 'SELECT 1');
				expect(mockRunner).toHaveBeenCalledTimes(1); // once for length
			});
			it('should put the results of the metadata query into the columns fields', () => {
				const columns = [{ column_name: '5', column_type: 'INTEGER', null: 'YES' }];
				expectedColumns = columns;
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				expect(q.columns).toEqual(columns);
			});
		});
		describe('Length', () => {
			it('should be fetched when creating a store', () => {
				expectedLength = [{ rowCount: 5 }];
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
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
			vi.useFakeTimers();
			// setup
			const metaSharedPromise = sharedPromise();
			expectedColumns = metaSharedPromise.promise; // use a shared promise to control how long the query takes
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			const subscriber = vi.fn();
			let i = 0;

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.columnsLoaded).toBe(false);
				expect(v.columnsLoading).toBe(true);
			});
			q.subscribe(subscriber);
			await vi.advanceTimersToNextTimerAsync();

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.columnsLoaded).toBe(true);
				expect(v.columnsLoading).toBe(false);
			});
			metaSharedPromise.resolve([]);

			await vi.advanceTimersToNextTimerAsync();
			await vi.advanceTimersToNextTimerAsync();
			expect(subscriber).toHaveBeenCalledTimes(2); // cols loading + loaded + length pub
			expect(i).toBe(2);
		});

		it('should publish when fetching length', async () => {
			vi.useFakeTimers();
			const lengthSharedPromise = sharedPromise();
			expectedLength = lengthSharedPromise.promise;
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			const subscriber = vi.fn();
			let i = 0;

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.lengthLoaded).toBe(false);
				expect(v.lengthLoading).toBe(true);
			});
			q.subscribe(subscriber); // first call
			await vi.advanceTimersToNextTimerAsync();
			expect(subscriber).toHaveBeenCalledOnce();

			subscriber.mockImplementationOnce((v) => {
				i++;
				expect(v.lengthLoaded).toBe(true);
				expect(v.lengthLoading).toBe(false);
				expect(v.length).toBe(5);
			});
			expect(subscriber).toHaveBeenCalledOnce();
			lengthSharedPromise.resolve([{ rowCount: 5 }]); // second call??
			await vi.advanceTimersToNextTimerAsync();
			expect(subscriber).toHaveBeenCalledTimes(2); /* Length load start, length load end */
			expect(i).toBe(2);
		});
	});

	describe('QueryBuilder interface', () => {
		it("should pass known columns when the derived query doesn't have different selects", () => {
			expectedColumns = [];
			let initial;
			getMockQuery(
				{
					callback: (v) => (initial = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			const filtered = initial.where`1 = 1`;
			expect(filtered.columns).toEqual(expectedColumns);
			expect(filtered.columns).toEqual(initial.columns); // referential equality
			/*
				One columns fetch
				Two length fetches
			*/
			expect(mockRunner).toHaveBeenCalledTimes(3);
		});
		it('should inherit noResolve from the parent query', () => {
			let initial;
			getMockQuery(
				{
					callback: (v) => (initial = v),
					loadGracePeriod: 0
				},
				{ noResolve: true }
			)(() => 'SELECT 1');
			let filtered = initial.where`1 = 1'`;
			expect(filtered.opts.noResolve).toBe(true);

			getMockQuery(
				{
					callback: (v) => (initial = v),
					loadGracePeriod: 0
				},
				{ noResolve: false }
			)(() => 'SELECT 1');
			filtered = initial.where`1 = 1`;
			expect(filtered.opts.noResolve).toBe(false);
		});

		describe('.where', () => {
			it('should create a new query', () => {
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				const filtered = q.where`1 = 1`;
				expect(filtered).not.toBe(q);
				expect(filtered.originalText.includes('WHERE 1 = 1')).toBe(true);
			});
			it('should depend on the parent query', () => {
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				const filtered = q.where`1 = 1`;
				expect(filtered.__dag.parents.has(q.__dag)).toBe(true);
			});
			it('should track any new dependencies that were detected', () => {
				let q1;
				let q2;
				getMockQuery(
					{
						callback: (v) => (q1 = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');

				getMockQuery(
					{
						callback: (v) => (q2 = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT "magic-horseshoes"');
				inputs.x.value = '/* Magic Comment */';
				const filtered = q1.where`1 IN (${q2}) OR 5 IN ${inputs.x.value}`;
				expect(filtered.__dag.parents.has(q1.__dag)).toBe(true);
				expect(filtered.__dag.parents.has(q2.__dag)).toBe(true);
				expect(filtered.__dag.parents.has(inputs.x.__dag)).toBe(true);
				expect(filtered.originalText.includes(`SELECT "magic-horseshoes"`)).toBe(true);
				expect(filtered.originalText.includes(`/* Magic Comment */`)).toBe(true);
			});

			it('should not let you call .where when the function is detached from the query', () => {
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				const { where } = q;
				expect(() => where`1=1`).toThrow();
			});

			it('should not update the child query when the variable changes', () => {
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'select 1');

				/*
					We don't have a lot of control here
					Queries are immutable - one SQL statement = one Query object, so we can't
					update filtered in place.

					We have to rely on the framework for reactivity here until a different solution
					can address this
				*/

				inputs.x.value = '/* Magic Comment */';
				const filtered = q.where`${inputs.x.value}`;
				expect(filtered.originalText.includes(`/* Magic Comment */`)).toBe(true);

				inputs.x.value = '/* Magic Comment 2 */';
				expect(filtered.originalText.includes(`/* Magic Comment 2 */`)).toBe(false);
			});
		});
		describe('.withOrdinal', () => {
			it('should add an ordinal column', () => {
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				const filtered = q.withOrdinal``;
				expect(filtered.originalText).toContain('AS "ordinal"');
			});
			it('should depend on the parent query', () => {
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				const filtered = q.withOrdinal``;
				expect(filtered.__dag.parents.has(q.__dag)).toBe(true);
			});
			it('should track input dependencies', () => {
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				inputs.x.value = 5;
				const filtered = q.withOrdinal`${inputs.x.value}`;
				expect(filtered.__dag.parents.has(q.__dag)).toBe(true);
				expect(filtered.__dag.parents.has(inputs.x.__dag)).toBe(true);
			});
		});
	});

	describe('EventEmitter interface', () => {
		it('should emit dataReady when done fetching data', async () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
			const sub = vi.fn();
			q.on('dataReady', sub);
			await q.fetch();
			expect(sub).toHaveBeenCalledWith(undefined, 'dataReady');
		});
		it('should respect .off', async () => {
			let q;
			getMockQuery(
				{
					callback: (v) => (q = v),
					loadGracePeriod: 0
				},
				{}
			)(() => 'SELECT 1');
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
				// const q = getMockQuery('SELECT a broken value', { initialQuery });
				let q;
				getMockQuery(
					{
						callback: (v) => (q = v),
						loadGracePeriod: 0
					},
					{}
				)(() => 'SELECT 1');
				console.log(q);

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
