import { nanoid } from 'nanoid';
import { isDebug } from '../../lib/debug.js';
import {
	Query as QueryBuilder,
	sql as taggedSql,
	sum as qSum,
	avg as qAvg,
	min as qMin,
	max as qMax,
	median as qMedian,
	count as qCount
} from '@uwdata/mosaic-sql';
import { sharedPromise } from '../../lib/sharedPromise.js';
import { resolveMaybePromise } from '../utilities/resolveMaybePromise.js';
import { getQueryScore } from './queryScore.js';
import { VITE_EVENTS } from '../../build-dev/vite/constants.js';
import { sterilizeQuery } from './sterilizeQuery.js';

/**
 * @typedef {import("../types.js").QueryResultRow} QueryResultRow
 */

/**
 * @template T
 * @typedef {import('../types.js').MaybePromise<T>} MaybePromise
 */

/**
 * @template {QueryResultRow} [RowType=QueryResultRow]
 * @typedef  {import('../../lib/sharedPromise.js').SharedPromise<Query<RowType>>} ChainableSharedPromise
 */

/**
 * @template {QueryResultRow[]} RowType
 * @typedef {import("svelte/store").Readable<RowType>} Readable
 */

/**
 * @template {QueryResultRow} [RowType=QueryResultRow]
 * @typedef {RowType[] & Query<RowType>} QueryValue
 */

/**
 * @typedef {Object} QueryEvents<RowType>
 * @property {undefined} dataReady
 * @property {number} highScore
 * @property {number} longRun
 * @property {Error} error
 */

/**
 * @typedef {Object} QueryGlobalEvents
 * @property {undefined} inFlightQueryStart
 * @property {undefined} inFlightQueryEnd
 * @property {import('../types.js').QueryDebugPayload} queryCreated
 * @property {undefined} cacheCleared
 */
/** @typedef {import ("../types.js").EventEmitter<QueryGlobalEvents>} QueryGlobalEventEmitter */

/**
 * @typedef {import('../types.js').EventEmitter<QueryEvents>} QueryEventEmitter
 */

/**
 * @class
 * @template {QueryResultRow} [RowType=QueryResultRow]
 * @implements {Query<RowType>}
 * @implements {Readable<QueryValue<RowType>>}
 * @implements {QueryEventEmitter}
 */
export class Query {
	////////////////////////////
	/// < State Primatives > ///
	////////////////////////////

	/** @type {QueryValue<RowType>} */
	#value;

	get value() {
		return this.#value;
	}

	/// Data
	/** @type {RowType[]} */
	#data = [];
	/** @type {number} */
	#dataQueryTime = -1;
	get dataLoaded() {
		return ['resolved', 'rejected'].includes(this.#sharedDataPromise.state);
	}
	get dataLoading() {
		return this.#sharedDataPromise.state === 'loading';
	}
	get dataQueryTime() {
		return this.#dataQueryTime;
	}
	/// Length
	/** @type {number} */
	#length = 0;
	/** @type {number} */
	#lengthQueryTime = -1;
	get length() {
		return this.#length;
	}
	get lengthLoaded() {
		return ['resolved', 'rejected'].includes(this.#sharedLengthPromise.state);
	}
	get lengthLoading() {
		return this.#sharedLengthPromise.state === 'loading';
	}
	get lengthQueryTime() {
		return this.#lengthQueryTime;
	}

	/// Columns
	/** @type {import('../../types/duckdb-wellknown.js').DescribeResultRow[]} */
	#columns = [];
	/** @type {Record<keyof RowType, undefined> | undefined} */
	#mockRow = undefined;
	/** @type {number} */
	#columnsQueryTime = -1;

	get columns() {
		return this.#columns;
	}
	get columnsLoaded() {
		return ['resolved', 'rejected'].includes(this.#sharedColumnsPromise.state);
	}
	get columnsLoading() {
		return this.#sharedColumnsPromise.state === 'loading';
	}
	get columnsQueryTime() {
		return this.#columnsQueryTime;
	}

	/**
	 * True when data, length, and columns have all been fetched
	 */
	get ready() {
		return (
			this.#sharedLengthPromise.state === 'resolved' &&
			this.#sharedColumnsPromise.state === 'resolved' &&
			this.#sharedDataPromise.state === 'resolved'
		);
	}
	/**
	 * True when data, length, or columns are currently being fetched
	 */
	get loading() {
		return (
			this.#sharedLengthPromise.state === 'loading' ||
			this.#sharedColumnsPromise.state === 'loading' ||
			this.#sharedDataPromise.state === 'loading'
		);
	}

	/**
	 * Use the getter/setter for #error instead of this value directly
	 * @type {Error | undefined}
	 */
	#__error;

	get #error() {
		return this.#__error;
	}
	/**
	 * @param {Error | undefined} v
	 */
	set #error(v) {
		if (!v) return;
		console.error(`${this.id} | Error in Query!`, v?.message);
		this.#emit('error', v);
		this.#__error = v;
	}
	get error() {
		return this.#error;
	}

	/** @type {QueryBuilder} */
	#query;
	/** @type {string} */
	#originalText;
	/**
	 * The Query text as is was provided
	 */
	get originalText() {
		return this.#originalText;
	}
	/**
	 * The Query text as it is being executed
	 */
	get text() {
		return this.#query?.toString() ?? "SELECT 'Empty Query' WHERE 0";
	}

	//////////////////////////////
	/// </ State Primatives /> ///
	//////////////////////////////

	//////////////////////////
	/// < Global Loading > ///
	//////////////////////////

	/** @type {Set<Query>} */
	static #inFlightQueries = new Set();

	static get queriesInFlight() {
		return Query.#inFlightQueries.size > 0;
	}

	/**
	 * @protected
	 */
	static resetInFlightQueries() {
		Query.#inFlightQueries = new Set();
	}

	/**
	 * @param {Query<any>} q
	 */
	static #markInFlight = (q) => {
		if (this.#inFlightQueries.size === 0) {
			// We are starting
			this.#globalEmit('inFlightQueryStart', undefined);
		}
		Query.#inFlightQueries.add(q);
		q.#sharedDataPromise.promise.finally(() => {
			Query.#inFlightQueries.delete(q);
			if (this.#inFlightQueries.size === 0) {
				// We are done
				this.#globalEmit('inFlightQueryEnd', undefined);
			}
			// Remove
		});
	};

	/** @type {import("../types.js").EventMap<QueryGlobalEvents>} */
	static #globalHandlerMap = {
		inFlightQueryStart: new Set(),
		inFlightQueryEnd: new Set(),
		queryCreated: new Set(),
		cacheCleared: new Set()
	};
	/**
	 * @template {keyof QueryGlobalEvents} Event
	 * @param {Event} event
	 * @param {QueryGlobalEvents[Event]} value
	 */
	static #globalEmit = (event, value) => {
		Query.#globalHandlerMap[event].forEach((fn) => fn(value, event));
	};

	/** @type {QueryGlobalEventEmitter["addEventListener"]} */
	static addEventListener(event, handler) {
		this.#globalHandlerMap[event].add(handler);
	}
	/** @type {QueryGlobalEventEmitter["removeEventListener"]} */
	static removeEventListener(event, handler) {
		this.#globalHandlerMap[event].delete(handler);
	}
	/////////////////////////////
	/// </ Global Loading />  ///
	/////////////////////////////

	////////////////////
	/// < Fetching > ///
	////////////////////

	static #scoreThreshold = 10 * 1024 * 1024;
	/** @type { number } */
	#score = -1;
	get score() {
		return this.#score;
	}

	#calculateScore = () => {
		if (this.lengthLoaded && this.columnsLoaded) {
			this.#score = getQueryScore(this.length, this.columns);
			if (this.#score > Query.#scoreThreshold) {
				this.#emit('highScore', this.#score);
			}
		} else {
			Promise.allSettled([this.#sharedLengthPromise.promise, this.#sharedColumnsPromise.promise])
				.then(([$lengthRaw, $columnsRaw]) => {
					if ($lengthRaw.status === 'rejected' || $columnsRaw.status === 'rejected') {
						// TODO: Throw here?
						this.#score = -1;
						return;
					}

					if (!this.#length || !this.#columns) {
						// TODO: Throw here?
						this.#score = -1;
						return;
					}
					this.#score = getQueryScore(this.length, this.columns);
					if (this.#score > Query.#scoreThreshold) {
						this.#emit('highScore', this.#score);
					}
				})
				.catch((e) => {
					console.error(`${this.id} | Failed to calculate Query score ${e}`);
				});
		}
	};

	/** @type {ChainableSharedPromise<RowType>} */
	#sharedDataPromise = sharedPromise(() =>
		this.publish(`data promise (${this.#sharedDataPromise.state})`)
	);
	/** @returns {MaybePromise<Query<RowType>>} */
	#fetchData = () => {
		if (this.#sharedDataPromise.state !== 'init') {
			return this.#sharedDataPromise.promise;
		}
		if (this.#error) {
			this.#debug('data error', 'Refusing to execute data query, store has an error state');
			return this.#sharedDataPromise.promise;
		}
		if (this.#sharedDataPromise.state !== 'init' || this.opts.noResolve)
			return this.#sharedDataPromise.promise;
		this.#sharedDataPromise.start();

		const dataQuery =
			`
---- Data ${this.#id} ${this.#hash}
${this.text.trim()}
        `.trim() + '\n';

		this.#debugStyled('data query text', '\n' + dataQuery, 'font-family: monospace;');

		// gotta love jsdoc sometimes
		const typedRunner = /** @type {import('../types.js').Runner<RowType>} */ (this.#executeQuery);
		Query.#markInFlight(this);
		const before = performance.now();
		const resolved = resolveMaybePromise(
			(result, isPromise) => {
				this.#data = result;
				const after = performance.now();

				if (before - after > 5000) {
					this.#emit('longRun', before - after);
					this.#debug('long-running', `Query took ${before - after}ms to execute`);
				}

				this.#dataQueryTime = after - before;

				this.#fetchLength();
				this.#sharedDataPromise.resolve(this);
				this.#emit('dataReady', undefined);
				if (isPromise) {
					return this.#sharedDataPromise.promise;
				} else {
					return this;
				}
			},
			() => typedRunner(dataQuery, `${this.#id}_data`),
			(e, isPromise) => {
				this.#error = e;
				this.#sharedDataPromise.reject(e);
				if (isPromise) {
					return this.#sharedDataPromise.promise;
				} else {
					return this;
				}
			}
		);
		return resolved;
	};
	fetch = () => {
		const cols = this.#fetchColumns();
		if (
			cols instanceof Promise &&
			/* noResolve will always return a promise, even when fetch is synchronous */
			!this.opts.noResolve
		) {
			return Promise.allSettled([this.#fetchColumns(), this.#fetchData()]).then(() => this.value);
		}
		this.#fetchData();
		return this.value;
	};
	/**
	 * Executes the query without actually updating the state
	 * This is helpful for ensuring that the related parquet files
	 * are available, even when SSR is used to initially hydrate the
	 * query / page.
	 *
	 * Does not run on the server, only in browser
	 */
	backgroundFetch = () => {
		if (typeof window === 'undefined') {
			this.#debug('background fetch skip', 'Did not execute backgroundFetch in SSR');
			return;
		}
		this.#debug('background fetch', `Executed backgroundFetch`);
		resolveMaybePromise(
			() => {},
			async () => {
				await new Promise((resolve) => setTimeout(resolve, 0));
				return this.#executeQuery(`--data\n${this.text.trim()}`, this.id);
			},
			() => {}
		);
	};

	/** @type {ChainableSharedPromise<RowType>} */
	#sharedLengthPromise = sharedPromise(() =>
		this.publish(`length promise (${this.#sharedLengthPromise.state})`)
	);
	/** @returns {MaybePromise<Query<RowType>>} */
	#fetchLength = () => {
		// If data has already been fetched, or provided
		// Don't query for the length again
		if (
			this.#data &&
			this.#sharedDataPromise.state === 'resolved' &&
			this.#sharedLengthPromise.state === 'init'
		) {
			this.#debug(
				'length inferred',
				'Inferred length from already-resolved data promise',
				this.#data
			);
			this.#length = this.#data.length;
			// Done
			this.#sharedLengthPromise.resolve(this);
			return this.#sharedLengthPromise.promise;
		}
		if (this.#error) {
			this.#debug(
				'length error',
				'Refusing to execute length query, store has an error state',
				this.#error
			);
			this.#sharedLengthPromise.reject(this.#error); // Is this the right call?
			return this.#sharedLengthPromise.value ?? this.#sharedLengthPromise.promise;
		}
		if (this.#sharedLengthPromise.state !== 'init' || this.opts.noResolve)
			return this.#sharedLengthPromise.promise;

		this.#sharedLengthPromise.start();

		const lengthQuery =
			`
---- Length ${this.#id} (${this.#hash})
SELECT COUNT(*) as rowCount FROM (${this.text.trim()})
        `.trim() + '\n';

		// gotta love jsdoc sometimes
		const typedRunner =
			/** @type {import('../types.js').Runner<{rowCount: number}>} */
			(this.#executeQuery);

		this.#debugStyled('length query text', '\n' + lengthQuery, 'font-family: monospace;');
		const before = performance.now();
		const resolved = resolveMaybePromise(
			/** @returns {MaybePromise<Query<RowType>>} */
			(lengthResult, isPromise) => {
				const after = performance.now();
				this.#lengthQueryTime = after - before;
				this.#length = lengthResult[0].rowCount;
				this.#sharedLengthPromise.resolve(this);
				if (isPromise) {
					return this.#sharedLengthPromise.promise;
				} else {
					return this;
				}
			},
			() => typedRunner(lengthQuery, `${this.#id}_length`),
			/** @returns {MaybePromise<Query<RowType>>} */
			(e, isPromise) => {
				this.#error = e;
				this.#sharedLengthPromise.reject(e);
				if (isPromise) {
					return this.#sharedLengthPromise.promise;
				} else {
					return this;
				}
			}
		);
		return /** @type {MaybePromise<Query<RowType>>} */ (resolved);
	};

	/** @type {ChainableSharedPromise<RowType>} */
	#sharedColumnsPromise = sharedPromise(() =>
		this.publish(`columns promise (${this.#sharedColumnsPromise.state})`)
	);
	/** @returns {MaybePromise<Query<RowType>>} */
	#fetchColumns = () => {
		if (this.#error) {
			this.#debug(
				'cols query error',
				'Refusing to execute columns query, store has an error state',
				this.#error
			);
			// Return the value or the promise if not resolved
			return this.#sharedColumnsPromise.value ?? this.#sharedColumnsPromise.promise;
		}

		// Store is in some started state
		if (this.#sharedColumnsPromise.state !== 'init' || this.opts.noResolve)
			return this.#sharedColumnsPromise.promise;
		// Indicate that work has started on this promise
		this.#sharedColumnsPromise.start();

		const metaQuery =
			`
---- Columns ${this.#id} (${this.#hash})
DESCRIBE ${this.text.trim()}
        `.trim() + '\n';

		this.#debugStyled('columns query text', '\n' + metaQuery, 'font-family: monospace;');

		// gotta love jsdoc sometimes
		const typedRunner =
			/** @type {import('../types.js').Runner<import('../../types/duckdb-wellknown.js').DescribeResultRow>} */
			(this.#executeQuery);
		const before = performance.now();
		const resolved = resolveMaybePromise(
			(description, isPromise) => {
				const after = performance.now();
				this.#columnsQueryTime = after - before;
				// Update inner value
				this.#columns = description;
				// Resolve store
				this.#sharedColumnsPromise.resolve(this);

				this.#mockRow = /** @type {Record<keyof RowType, undefined>} */ (
					Object.fromEntries(description.map((d) => [d.column_name, undefined]))
				);

				if (isPromise) {
					return this.#sharedColumnsPromise.promise;
				} else {
					return this;
				}
			},
			() => typedRunner(metaQuery, `${this.#id}_columns`),
			/** @returns {MaybePromise<Query<RowType>>} */
			(e, isPromise) => {
				this.#error = e;
				this.#sharedColumnsPromise.reject(e);

				if (isPromise) {
					return this.#sharedColumnsPromise.promise;
				} else {
					return this;
				}
			}
		);
		return /** @type {MaybePromise<Query<RowType>>} */ (resolved);
	};
	//////////////////////
	/// </ Fetching /> ///
	//////////////////////

	//////////////////////////
	/// < Type Narrowing > ///
	//////////////////////////
	/**
	 * @ignore
	 * @private
	 */
	get isQuery() {
		return true;
	}

	/**
	 * @template {QueryResultRow} RowType
	 * @param {unknown} q
	 * @returns {q is Query<RowType>}
	 */
	static isQuery = (q) => {
		// TODO: Should we type-narrow on row type as well
		// Type narrow
		if (typeof q !== 'object' || !q) return false;

		const hasDuckType = 'isQuery' in q && q['isQuery'] === true;

		return hasDuckType;
	};
	////////////////////////////
	/// </ Type Narrowing /> ///
	////////////////////////////

	/** @param {unknown} v */
	static [Symbol.hasInstance](v) {
		return Query.isQuery(v);
	}

	/////////////////
	/// < Proxy > ///
	/////////////////
	/** @type {string[]} */
	static get ProxyFetchTriggers() {
		return ['at'];
	}
	/** @returns {QueryValue<RowType>} */
	#buildProxy = () => {
		/** @type {QueryValue<RowType>} */
		const proxy = /** @type {QueryValue<RowType>} */ (
			new Proxy(/** @type {RowType[]} */ ([]), {
				getPrototypeOf: () => {
					return Object.getPrototypeOf(this.#data);
				},
				has: (self, prop) => {
					return prop in this.#data || prop in this;
				},
				get: (_self, rawProp) => {
					/** @type {string | symbol | number} */
					let prop = rawProp;

					if (typeof prop === 'string' && /^[\d.]+$/.exec(prop)) prop = parseInt(prop);
					if (typeof prop === 'number' || Query.ProxyFetchTriggers.includes(prop.toString())) {
						if (this.#sharedDataPromise.state === 'init') {
							this.#debug('implicit fetch', `Implicit query fetch triggered by ${prop.toString()}`);
							this.#fetchData(); // catches itself
						}
					}

					if (prop === 'length') {
						this.#fetchLength();
					}
					if (prop === 'constructor') return this.#data.constructor;
					if (prop === 'toString') return this.#data.toString.bind(this.#data);

					// Default field resolution
					const target =
						prop in this
							? this // Prop exists on Query
							: this.#data && prop in this.#data
								? this.#data // Prop exists on Array
								: null; // Prop exists on neither
					if (target === null)
						if (typeof prop !== 'number') return undefined;
						else {
							if (prop > this.#length) return undefined;
							return this.#mockRow ?? {};
						}

					const field = target[/** @type {keyof typeof target} */ (prop)];

					if (typeof field === 'function') return field.bind(target);
					else return field;
				}
			})
		);

		return proxy;
	};
	///////////////////
	/// </ Proxy /> ///
	///////////////////

	/////////////////////
	/// < Factories > ///
	/////////////////////
	/**
	 * This is a fairly arbitrary number that determines how much data
	 * the Query will cache internally. The larger the number, the
	 * larger the cache will be.
	 *
	 * The number is based on our Query Score calculation, see
	 * queryScore.js for details on how this is calculated.
	 *
	 * @default 5 * 10 * 1024
	 *
	 */
	static CacheMaxScore = 5 * 10 * 1024;
	/**
	 * @type {Map<string, {added: number, query: Query<any>}>}
	 */
	static #cache = new Map();

	static emptyCache = () => {
		this.#cache.clear();
		this.#globalEmit('cacheCleared', undefined);
	};

	static get cacheSize() {
		return this.#cache.size;
	}

	/**
	 * @param {Query<any>} q
	 */
	static #addToCache = (q) => {
		this.#cache.set(q.hash, {
			query: q,
			added: Date.now()
		});

		Query.#debugStatic('cache', `Added to cache: ${q.hash}`, {
			cacheSize: this.#cache.size,
			cacheScore: Array.from(this.#cache.values()).reduce((sum, q) => sum + q.query.score, 0)
		});
	};

	/**
	 * @template {QueryResultRow} [RowType=QueryResultRow]
	 * @param {string} hash
	 * @returns {Query<RowType> | null}
	 */
	static #getFromCache = (hash) => {
		const cachedValue = this.#cache.get(hash);
		if (cachedValue) {
			return cachedValue.query;
		}
		return null;
	};

	static #cacheCleanup = () => {
		let sumScore = Array.from(this.#cache.values()).reduce((sum, q) => sum + q.query.score, 0);
		const sorted = Array.from(this.#cache.values()).sort((a, b) => a.added - b.added);
		while (sumScore > this.CacheMaxScore) {
			const oldest = sorted.shift();
			if (!oldest) break;
			this.#cache.delete(oldest.query.hash);
			sumScore -= oldest.query.score;
		}
	};

	/**
	 * @param {import('../types.js').QueryReactivityOpts<any>} reactiveOpts Callback that is executed when the new query is ready
	 * @param {import('../types.js').QueryOpts<any>} [opts]
	 * @param {QueryValue<any>} [initialQuery]
	 */
	static createReactive = (reactiveOpts, opts, initialQuery) => {
		const { loadGracePeriod = 250, callback = () => {}, execFn } = reactiveOpts;

		/** @type {import('../types.js').CreateQuery<any>} */
		const createFn = Query.create;
		/** @type {QueryValue<any> | undefined} */
		let activeQuery = initialQuery;

		let changeIdx = 0;
		/** @type {() => unknown} */
		let unsub;
		const waitFor =
			/**
			 * @param {string | Query} nextQuery
			 * @param {import('../types.js').QueryOpts<any>} [newOpts]
			 * @returns {Promise<void> | void}
			 */
			(nextQuery, newOpts) => {
				if (!activeQuery) throw new Error();
				changeIdx += 1;
				const targetChangeIdx = changeIdx;
				Query.#debugStatic(
					`${activeQuery.id} (${hashQuery(nextQuery)}) | Reactive Updating`,
					nextQuery,
					{
						changeIdx,
						targetChangeIdx,
						hash: hashQuery(nextQuery)
					},
					{
						initialOpts: opts,
						newOpts: newOpts
					}
				);
				const newQuery = Query.isQuery(nextQuery)
					? nextQuery
					: createFn(
							nextQuery,
							execFn,
							// clear initialData and initialError on opts, but allow for newOpts to provide them
							Object.assign({}, opts, { initialData: undefined, initialError: undefined }, newOpts)
						);

				const fetched = newQuery.fetch();
				let dataMaybePromise = fetched;
				if (fetched instanceof Promise) {
					dataMaybePromise = Promise.race([
						new Promise((r) => setTimeout(r, loadGracePeriod)),
						newQuery.fetch()
					]);
				}

				resolveMaybePromise(
					() => {
						if (changeIdx !== targetChangeIdx) {
							Query.#debugStatic(`changeIdx does not match, results are discarded`);
							return;
						}
						unsub?.();
						activeQuery = newQuery.value;
						unsub = activeQuery.subscribe(callback);
					},
					dataMaybePromise,
					(e) => {
						console.warn(`Error while attempting to update reactive query: ${e.message}`);
						throw e;
					}
				);
			};

		function removeInitialState() {
			opts = { ...opts, initialData: undefined, initialError: undefined };
		}

		/**
		 * @param {string} queryText
		 * @param {import('../types.js').QueryOpts<any>} [newOpts]
		 * @returns {void}
		 */
		return (queryText, newOpts) => {
			if (activeQuery) {
				resolveMaybePromise(
					() => {},
					waitFor(queryText, newOpts),
					(e) => {
						console.warn(`Error while attempting to update reactive query: ${e.message}`);
					}
				);
				return;
			}

			if (import.meta.hot?.data?.hmr) removeInitialState();
			activeQuery = createFn(queryText, execFn, Object.assign({}, opts, newOpts));

			const fetched = activeQuery.fetch();
			resolveMaybePromise(removeInitialState, fetched);

			// We don't want to use this after the initial creation!
			unsub = activeQuery.subscribe(callback);
			callback(activeQuery);
			return;
		};
	};

	static #devModeBootstrapped = false;
	static #devModeBootstraps = () => {
		if (!import.meta.hot || Query.#devModeBootstrapped) return;
		Query.#devModeBootstrapped = true;
		// We need to do some dev mode pipeing
		import.meta.hot.data.hmr = false;
		import.meta.hot.on(VITE_EVENTS.RESET_QUERIES, () => {
			if (import.meta.hot) import.meta.hot.data.hmr = true;
			Query.emptyCache();
		});
	};

	/**
	 * @template {QueryResultRow} [RowType=QueryResultRow]
	 * @type {import("../types.js").CreateQuery<RowType>}
	 */
	static create = (query, executeQuery, optsOrId, maybeOpts) => {
		if (import.meta.hot) {
			Query.#devModeBootstraps();
		}

		const queryHash = hashQuery(query);
		/** @type {import('../types.js').QueryOpts<RowType>} */
		let opts;
		if (typeof optsOrId === 'string') {
			opts = {
				...maybeOpts,
				id: optsOrId
			};
		} else if (optsOrId) {
			opts = optsOrId;
			if (!opts.id) opts.id = queryHash + '-' + Math.random().toString(36).substring(0, 4);
		} else {
			opts = {
				id: queryHash + '-' + Math.random().toString(36).substring(0, 4)
			};
		}
		if (!('autoScore' in opts)) {
			opts.autoScore = true;
		}

		if (!opts.disableCache) {
			/** @type {Query<RowType> | null} */
			const cached = Query.#getFromCache(queryHash);

			Query.#cacheCleanup();
			if (cached) {
				Query.#debugStatic(
					`${opts.id ?? '[query id missing]'} (${queryHash}) | Using cached query`,
					{ opts, hash: hashQuery(query) },
					query,
					cached
				);
				return cached.value;
			} else {
				Query.#debugStatic(
					`${opts.id ?? '[query id missing]'} (${queryHash}) | Cached query not found`,
					{
						opts,
						hash: hashQuery(query)
					},
					query
				);
			}
		} else
			Query.#debugStatic(
				`${opts.id ?? '[query id missing]'} (${queryHash}) | cache disabled`,
				`Cache is disabled for ${opts.id ?? '[query id missing]'}`,
				{ opts, query, hash: hashQuery(query) }
			);

		Query.#constructing = true;
		const output = new Query(query, executeQuery, opts);
		Query.#globalEmit('queryCreated', {
			raw: output,
			proxied: output.value
		});
		if (!opts.disableCache) {
			Query.#addToCache(output);
			Query.#cacheCleanup();
		}
		return output.value;
	};

	///////////////////////
	/// </ Factories /> ///
	///////////////////////

	static #debugStatic = isDebug()
		? (/** @type { string } */ label, /** @type {Parameters<typeof console.debug>} */ ...args) => {
				const groupName = `${(performance.now() / 1000).toFixed(3)} | Query | ${label}`;
				console.groupCollapsed(groupName);
				for (const arg of args) {
					if (typeof arg === 'function') console.debug(arg());
					else console.debug(arg);
				}
				console.groupEnd();
			}
		: () => {};
	static #debugStyledStatic = isDebug()
		? (/** @type {string} */ label, /** @type {string} */ text, /** @type {string} */ style) => {
				const groupName = `${(performance.now() / 1000).toFixed(3)} | Query | ${label}`;
				console.groupCollapsed(groupName);
				console.debug(`%c${text}`, style);
				console.groupEnd();
			}
		: () => {};

	#debug = isDebug()
		? (/** @type {string} */ label, /** @type {Parameters<typeof console.debug>} */ ...args) => {
				const groupName = `${(performance.now() / 1000).toFixed(3)} | ${this.id} (${this.hash}) | ${label}`;
				console.groupCollapsed(groupName);
				for (const arg of args) {
					if (typeof arg === 'function') console.debug(arg());
					else console.debug(arg);
				}
				console.groupEnd();
			}
		: () => {};

	#debugStyled = isDebug()
		? (/** @type {string} */ label, /** @type {string} */ text, /** @type {string} */ style) => {
				const groupName = `${(performance.now() / 1000).toFixed(3)} | ${this.id} (${this.hash}) | ${label}`;
				console.groupCollapsed(groupName);
				console.debug(`%c${text}`, style);
				console.groupEnd();
			}
		: () => {};

	static #constructing = false;

	/** @type {string} */
	#id;
	/** @type {string} */
	#hash;
	/** @type {import('../types.js').QueryOpts<RowType>} */
	#opts;

	/** @type {Pick<import("../types.js").QueryOpts<RowType>, 'autoScore' | 'noResolve' | 'disableCache'>} */
	get #inheritableOpts() {
		return {
			autoScore: this.#opts.autoScore,
			noResolve: this.#opts.noResolve,
			disableCache: this.#opts.disableCache
		};
	}

	/** @type {string} */
	get id() {
		return this.#id;
	}
	/** @type {string} */
	get hash() {
		return this.#hash;
	}

	/** @type {import('../types.js').Runner} */
	#executeQuery;

	/** @type {import('../types.js').QueryOpts} */
	opts;

	/** @type {string | undefined} */
	#createdStack;

	get createdStack() {
		return this.#createdStack;
	}

	// TODO: Score (this should be done in another file)
	// TODO: When dealing with builder functions, add a `select` or similar
	/**
	 * @param {QueryBuilder | string} query
	 * @param {import('../types.js').Runner} executeQuery
	 * @param {import("../types.js").QueryOpts<RowType>} opts
	 * @deprecated Use {@link Query.create} instead
	 */
	constructor(query, executeQuery, opts = {}) {
		this.#createdStack = new Error().stack
			?.split('\n')
			.slice(2)
			.map((line) => line.slice('    at '.length))
			.join('\n');
		const {
			id,
			initialData = undefined,
			knownColumns = undefined,
			initialError = undefined
		} = opts;
		this.opts = opts;
		this.#executeQuery = executeQuery;

		if (typeof query !== 'string' && !(query instanceof QueryBuilder)) {
			console.warn(`Query ${id} has no query text`);
			opts.noResolve = true;
		}

		if (!Query.#constructing) {
			console.warn(
				'Directly using new Query() is not a recommended use-case. Please use Query.create()'
			);
		}
		Query.#constructing = false; // make sure we reset it
		this.#value = this.#buildProxy();
		this.#originalText = query?.toString() ?? "SELECT 'Empty Query' WHERE 0";
		this.#hash = hashQuery(this.#originalText);
		this.#id = id ?? this.#hash;
		this.#opts = opts;

		if (query && typeof query !== 'string') this.#query = query;
		else if (query) {
			const q = new QueryBuilder()
				.from({
					/* 
						Use of nanoid prevent ambiguity when dealing with nested Queries; 
						in theory this could be the querystring has but that's kinda gross 
					*/
					[`inputQuery-${nanoid(2)}`]: taggedSql`(${sterilizeQuery(query)})`
				})
				.select('*');
			this.#query = q;
		} else {
			this.#query = new QueryBuilder();
			this.#error = new Error(`Refusing to create Query: No Query Text provided`);
			return;
		}

		if (initialError) {
			this.#error = initialError;
			return;
		}

		// TODO: Does this make sense?
		if (initialData) {
			this.#debug('initial data', 'Created with initial data', initialData);

			resolveMaybePromise(
				(d) => {
					this.#data = d;
					if (opts.initialDataDirty) {
						this.publish('dataDirty');
						this.#fetchData();
					} else {
						this.#sharedDataPromise.resolve(this);
						this.#fetchLength();
					}
				},
				initialData,
				(e) => {
					this.#error = e;
				}
			);
		} else if (opts.noResolve) {
			this.#sharedDataPromise.start();
			this.#sharedLengthPromise.start();
			this.#sharedColumnsPromise.start();
			return this;
		}

		if (knownColumns) {
			if (!Array.isArray(knownColumns))
				throw new Error(`Expected knownColumns to be an array`, { cause: knownColumns });

			this.#debug('known columns', 'Created with known columns', knownColumns);
			this.#columns = knownColumns;
			this.#sharedColumnsPromise.resolve(this);
		} else {
			resolveMaybePromise(
				() => {
					/* We don't need to do anything with the result */
				},
				this.#fetchColumns(),
				(e, isPromise) => {
					/* Async errors are handled elsewhere */ if (!isPromise) throw e;
				}
			);
		}
		resolveMaybePromise(
			() => {
				/* We don't need to do anything with the result */
			},
			this.#fetchLength(),
			(e, isPromise) => {
				/* Async errors are handled elsewhere */ if (!isPromise) throw e;
			}
		);
		if (opts.autoScore) {
			this.#calculateScore();
		}
	}

	////////////////////////////////////
	/// < Implement Store Contract > ///
	////////////////////////////////////
	/** @type {Set<import('../types.js').Subscriber<QueryValue<RowType>>>} */
	#subscribers = new Set();

	/**
	 * @param {import('../types.js').Subscriber<QueryValue<RowType>>} fn
	 * @returns {() => void} Unsubscribe function
	 */
	subscribe = (fn) => {
		this.#subscribers.add(fn);
		fn(this.#value);
		return () => this.#subscribers.delete(fn);
	};

	#publishIdx = 0;
	/**
	 * @protected
	 */
	publish = (/** @type {string} */ source) => {
		if (this.#publishIdx++ > 100000) throw new Error('Query published too many times.');
		this.#debug('publish', `Publishing triggered by ${source}`, this);
		this.#subscribers.forEach((fn) => fn(this.#value));
	};
	//////////////////////////////////////
	/// </ Implement Store Contract /> ///
	//////////////////////////////////////

	///////////////////////////////////////
	/// < EventEmitter Implementation > ///
	///////////////////////////////////////
	/** @type {import('../types.js').EventMap<QueryEvents>} */
	#handlerMap = {
		dataReady: new Set(),
		error: new Set(),
		highScore: new Set(),
		longRun: new Set()
	};

	/**
	 * @template {keyof QueryEvents} Event
	 * @param {Event} event
	 * @param {QueryEvents[Event]} value
	 */
	#emit = (event, value) => {
		this.#handlerMap[event].forEach((fn) => fn(value, event));
	};

	/**
	 * @template {keyof QueryEvents} Event
	 * @param {Event} event
	 * @param {import('../types.js').EventHandler<QueryEvents, Event>} handler
	 */
	on = (event, handler) => {
		this.#handlerMap[event].add(handler);
	};
	/**
	 * @template {keyof QueryEvents} Event
	 * @param {Event} event
	 * @param {import('../types.js').EventHandler<QueryEvents, Event>} handler
	 */
	off = (event, handler) => {
		this.#handlerMap[event].delete(handler);
	};
	addEventListener = this.on;
	removeEventListener = this.off;

	/////////////////////////////////////////
	/// </ EventEmitter Implementation /> ///
	/////////////////////////////////////////

	//////////////////////////////////
	/// < QueryBuilder Interface > ///
	//////////////////////////////////
	/** @param {string} filterStatement */
	where = (filterStatement) =>
		Query.create(this.#query.clone().where(taggedSql`${filterStatement}`), this.#executeQuery, {
			knownColumns: this.#columns,
			noResolve: this.#opts.noResolve
		});

	/**
	 * Attaches an `ordinal` column to the query based on some window statement
	 * @example myQuery.withOrdinal('partition by a order by b')
	 * @param {string} windowStatement
	 * @returns
	 */
	withOrdinal = (windowStatement) => {
		const newQ = this.#query.clone();
		newQ.select({
			ordinal: taggedSql`row_number() over (${windowStatement})`
		});
		return Query.create(newQ, this.#executeQuery, {
			...this.#inheritableOpts,
			knownColumns: this.#columns
		});
	};

	/**
	 * @param {string} searchTerm
	 * @param {string | string[]} searchCol
	 * @param {number | undefined} [searchThreshold]
	 * @returns {QueryValue<RowType & {similarity: number}>}
	 */
	search = (searchTerm, searchCol, searchThreshold) => {
		if (typeof searchThreshold === 'undefined' || searchThreshold < 0 || searchThreshold > 1) {
			// By default, increase threshold as more characters are added
			searchThreshold = 1 - 1 / searchTerm.length;
		}
		/** @type {import('../../types/duckdb-wellknown.js').DescribeResultRow[]} */
		const colsWithSimilarity = [
			...this.#columns,
			{ column_name: 'similarity', column_type: 'INTEGER', nullable: 'NO' }
		];

		/** @type {import('../types.js').CreateQuery<any>} */
		const typedCreateFn = Query.create;

		const escapedSearchTerm = searchTerm.replaceAll("'", "''");

		const cols = Array.isArray(searchCol) ? searchCol : [searchCol];
		const statements = cols
			.map((col) => {
				const exactMatch = taggedSql`CASE WHEN lower(CAST("${col.trim()}" AS VARCHAR)) = lower('${escapedSearchTerm}') THEN 2 ELSE 0 END`;
				const similarity = taggedSql`jaccard(lower(CAST("${col}" AS VARCHAR)), lower('${escapedSearchTerm}'))`;
				const exactSubMatch =
					escapedSearchTerm.length >= 1
						? taggedSql`CASE WHEN lower(CAST("${col.trim()}" AS VARCHAR)) LIKE lower('%${escapedSearchTerm.split(' ').join('%')}%') THEN 1 ELSE 0 END`
						: taggedSql`0`;
				return taggedSql`GREATEST((${exactMatch}), (${similarity}), (${exactSubMatch}))`;
			})
			.join(',');

		/** @type {QueryValue<RowType & {similarity: number}>} */
		const output = typedCreateFn(
			this.#query
				.clone()
				.$select(
					{
						similarity: taggedSql`GREATEST(${statements})`
					},
					'*'
				)
				.where(taggedSql`"similarity" > ${searchThreshold} `)
				.orderby(taggedSql`"similarity" DESC`),
			this.#executeQuery,
			{
				knownColumns: colsWithSimilarity,
				...this.#inheritableOpts
			}
		);
		return output;
	};

	/** @param {number} limit */
	limit = (limit) =>
		Query.create(this.#query.clone().limit(limit), this.#executeQuery, {
			knownColumns: this.#columns,
			...this.#inheritableOpts
		});

	/** @param {number} offset */
	offset = (offset) =>
		Query.create(this.#query.clone().offset(offset), this.#executeQuery, {
			knownColumns: this.#columns,
			...this.#inheritableOpts
		});
	/**
	 * @param {number} offset
	 * @param {number} limit
	 */
	paginate = (offset, limit) =>
		Query.create(this.#query.clone().offset(offset).limit(limit), this.#executeQuery, {
			knownColumns: this.#columns,
			...this.#inheritableOpts
		});

	/**
	 * @param {string[]} columns
	 * @param {boolean} [withRowCount=true]
	 */
	groupBy = (columns, withRowCount) => {
		const query = this.#query.clone();
		query.$select(columns);
		if (withRowCount) query.select({ rows: qCount('*') });
		query.$groupby(columns);

		return Query.create(query, this.#executeQuery, {
			knownColumns: this.#columns,
			...this.#inheritableOpts
		});
	};

	/**
	 * @typedef {Object} AggArgs
	 * @property {import("../types.js").MaybeAliasedCol | import("../types.js").MaybeAliasedCol[]} sum
	 * @property {import("../types.js").MaybeAliasedCol | import("../types.js").MaybeAliasedCol[]} avg
	 * @property {import("../types.js").MaybeAliasedCol | import("../types.js").MaybeAliasedCol[]} min
	 * @property {import("../types.js").MaybeAliasedCol | import("../types.js").MaybeAliasedCol[]} max
	 * @property {import("../types.js").MaybeAliasedCol | import("../types.js").MaybeAliasedCol[]} median
	 */

	/**
	 * @type {Record<keyof AggArgs, CallableFunction>}
	 */
	static #aggFns = {
		sum: qSum,
		avg: qAvg,
		min: qMin,
		max: qMax,
		median: qMedian
	};
	/**
	 *
	 * @param {string} aggKey
	 * @returns {aggKey is keyof AggArgs}
	 */
	static #checkAggFn = (aggKey) => {
		return aggKey in Query.#aggFns;
	};
	/**
	 * @param {AggArgs} cfg
	 */
	agg = (cfg) => {
		const query = this.#query.clone();
		for (const [aggType, aggArgs] of Object.entries(cfg)) {
			if (!Query.#checkAggFn(aggType)) throw new Error(`Unknown agg function: ${aggType}`);
			const aggFn = Query.#aggFns[aggType];
			const argsArray = Array.isArray(aggArgs) ? aggArgs : [aggArgs];
			for (const colSpec of argsArray) {
				const alias = typeof colSpec === 'object' ? colSpec.as : `${aggType}_${colSpec}`;
				const column = typeof colSpec === 'object' ? colSpec.col : colSpec;
				query.select({
					[alias]: aggFn(column)
				});
			}
		}
		return Query.create(query, this.#executeQuery, {
			knownColumns: this.#columns,
			...this.#inheritableOpts
		});
	};

	////////////////////////////////////
	/// </ QueryBuilder Interface /> ///
	////////////////////////////////////
}

/**
 * @param  {...any} args
 * @returns {string}
 */
export const hashQuery = (...args) => {
	/**
	 * @param {string} str
	 * @returns {string}
	 */
	const simpleHash = (str) => {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash &= hash; // Convert to 32bit integer
		}
		return new Uint32Array([hash])[0].toString(36);
	};
	return simpleHash(JSON.stringify(args));
};
