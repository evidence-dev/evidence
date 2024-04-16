import { nanoid } from 'nanoid';
import { isDebug } from '../lib/debug.js';
import { Query as QueryBuilder, sql, sql as taggedSql } from '@uwdata/mosaic-sql';
import { EvidenceError } from '../lib/EvidenceError.js';
import { sharedPromise } from '../lib/sharedPromise.js';
import { resolveMaybePromise } from './utils.js';
import { getQueryScore } from './queryScore.js';

/**
 * @typedef {import("./types.js").QueryResultRow} QueryResultRow
 */

/**
 * @template T
 * @typedef {import('./types.js').MaybePromise<T>} MaybePromise
 */

/**
 * @template {QueryResultRow} [RowType=QueryResultRow]
 * @typedef  {import('../lib/sharedPromise.js').SharedPromise<Query<RowType>>} ChainableSharedPromise
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
 * @property {Error} error
 */

/**
 * @typedef {Object} QueryGlobalEvents
 * @property {undefined} inFlightQueryStart
 * @property {undefined} inFlightQueryEnd
 */
/** @typedef {import ("./types.js").EventEmitter<QueryGlobalEvents>} QueryGlobalEventEmitter */

/**
 * @typedef {import('./types.js').EventEmitter<QueryEvents>} QueryEventEmitter
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
	#hasInitialData = false;

	/** @type {QueryValue<RowType>} */
	#value;

	get value() {
		return this.#value;
	}

	/// Data
	/** @type {RowType[]} */
	#data = [];
	get dataLoaded() {
		return ['resolved', 'rejected'].includes(this.#sharedDataPromise.state);
	}
	get dataLoading() {
		return this.#sharedDataPromise.state === 'loading';
	}
	/// Length
	/** @type {number} */
	#length = 0;
	get length() {
		return this.#length;
	}
	get lengthLoaded() {
		return ['resolved', 'rejected'].includes(this.#sharedLengthPromise.state);
	}
	get lengthLoading() {
		return this.#sharedLengthPromise.state === 'loading';
	}

	/// Columns
	/** @type {import('../types/duckdb-wellknown.js').DescribeResultRow[]} */
	#columns = [];
	/** @type {Record<keyof RowType, undefined> | undefined} */
	#mockRow = undefined;

	get columns() {
		return this.#columns;
	}
	get columnsLoaded() {
		return ['resolved', 'rejected'].includes(this.#sharedColumnsPromise.state);
	}
	get columnsLoading() {
		return this.#sharedColumnsPromise.state === 'loading';
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
		return this.#query.toString();
	}

	//////////////////////////////
	/// </ State Primatives /> ///
	//////////////////////////////

	//////////////////////////
	/// < Global Loading > ///
	//////////////////////////

	/** @type {Set<Query>} */
	static #inFlightQueries = new Set();

	static get QueriesInFlight() {
		return Query.#inFlightQueries.size > 0;
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

	/** @type {import("./types.js").EventMap<QueryGlobalEvents>} */
	static #globalHandlerMap = {
		inFlightQueryStart: new Set(),
		inFlightQueryEnd: new Set()
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
						console.log('Length or columns rejected');
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
			this.#debug('Refusing to execute data query, store has an error state');
			return this.#sharedDataPromise.promise;
		}
		if (this.#sharedDataPromise.state !== 'init' || this.opts.noResolve)
			return this.#sharedDataPromise.promise;
		this.#sharedDataPromise.start();

		const dataQuery =
			`
---- Data ${this.#id} ${this.#hash}
${this.#query.toString()}
        `.trim() + '\n';

		this.#debugStyled('\n' + dataQuery, 'font-family: monospace;');

		// gotta love jsdoc sometimes
		const typedRunner = /** @type {import('./types.js').Runner<RowType>} */ (this.#executeQuery);
		Query.#markInFlight(this);
		const resolved = resolveMaybePromise(
			(result, isPromise) => {
				this.#data = result;

				this.#sharedDataPromise.resolve(this);
				this.#emit('dataReady', undefined);
				if (isPromise) {
					return this.#sharedDataPromise.promise;
				} else {
					return this;
				}
			},
			typedRunner(dataQuery, `${this.#id}_data`),
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
	fetch = async () => {
		return Promise.allSettled([this.#fetchColumns(), this.#fetchData(), this.#fetchLength]).then(
			() => this.value
		);
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
			this.#debug('Did not execute backgroundFetch in SSR');
			return
		}
		this.#debug(`Executed backgroundFetch`);
		resolveMaybePromise(
			() => {},
			async () => {

				await new Promise((resolve) => setTimeout(resolve, 0));
				return this.#executeQuery(`--data\n${this.#query.toString()}`, this.id);
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
			this.#debug('Inferred length from already-resolved data promise', this.#data);
			this.#length = this.#data.length;
			// Done
			this.#sharedLengthPromise.resolve(this);
			return this.#sharedLengthPromise.promise;
		}
		if (this.#error) {
			this.#debug('Refusing to execute length query, store has an error state');
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
			/** @type {import('./types.js').Runner<{rowCount: number}>} */
			(this.#executeQuery);

		this.#debugStyled('\n' + lengthQuery, 'font-family: monospace;');

		const resolved = resolveMaybePromise(
			/** @returns {MaybePromise<Query<RowType>>} */
			(lengthResult, isPromise) => {
				this.#length = lengthResult[0].rowCount;
				this.#sharedLengthPromise.resolve(this);
				if (isPromise) {
					return this.#sharedLengthPromise.promise;
				} else {
					return this;
				}
			},
			typedRunner(lengthQuery, `${this.#id}_length`),
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
			this.#debug('Refusing to execute columns query, store has an error state');
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
DESCRIBE ${this.#query.toString()}
        `.trim() + '\n';

		this.#debugStyled('\n' + metaQuery, 'font-family: monospace;');

		// gotta love jsdoc sometimes
		const typedRunner =
			/** @type {import('./types.js').Runner<import('../types/duckdb-wellknown.js').DescribeResultRow>} */
			(this.#executeQuery);

		const resolved = resolveMaybePromise(
			(description, isPromise) => {
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
			typedRunner(metaQuery, `${this.#id}_columns`),
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
							this.#debug(`Implicit query fetch triggered by ${prop.toString()}`);
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

		if (isDebug())
			console.debug(`Added to cache: ${q.hash}`, {
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
		while (sumScore > this.CacheMaxScore) {
			// TODO: Is this efficient enough? Sorting once per iteration is slightly gross
			const oldest = Array.from(this.#cache.values()).sort((a, b) => a.added - b.added)[0];
			this.#cache.delete(oldest.query.hash);
			sumScore -= oldest.query.score;
		}
	};

	/*
		TODO: Write an update function?
		Update will accept the same parameters as create (?)
		It will return a promise race to load for 250ms and return the new store (or whenver the new store is loaded)
		This will let the reactivity live outside of the Component
	*/

	/**
	 * @param {import('./types.js').Runner} executeQuery
	 * @param {string | import("@uwdata/mosaic-sql").Query} initialQuery
	 * @param {import('./types.js').QueryOpts} [defaultOpts={}]
	 * @param {number} [loadDelay=250]
	 * @returns {{ initialValue: QueryValue, updater: <T extends QueryResultRow>(query: string, opts: import('./types.js').QueryOpts<T>) => Promise<QueryValue<T>>}}
	 */
	static reactive = (executeQuery, initialQuery, defaultOpts, loadDelay = 250) => {
		/** @type {import('./types.js').CreateQuery<any>} */
		const createFn = Query.create;

		/** @type {QueryValue<any>} */
		let oldQuery = createFn(initialQuery, executeQuery, { ...defaultOpts });

		/**
		 * @template {QueryResultRow} [RowType=QueryResultRow]
		 * @param {string | import("@uwdata/mosaic-sql").Query} query
		 * @param {import('./types.js').QueryOpts<RowType>} [opts={}]
		 * @returns {Promise<QueryValue<RowType>>}
		 */
		const updater = async (query, opts) => {
			/** @type {QueryValue<RowType>} */
			const newQuery = createFn(query, executeQuery, {
				...defaultOpts,
				...opts
			});

			if (oldQuery?.hash === newQuery.hash) return newQuery.fetch();

			return Promise.race([newQuery.fetch(), new Promise((r) => setTimeout(r, loadDelay))]).then(
				() => {
					oldQuery = newQuery;
					return newQuery;
				}
			);
		};
		return {
			updater,
			initialValue: oldQuery
		};
	};

	/**
	 * @template {QueryResultRow} [RowType=QueryResultRow]
	 * @type {import("./types.js").CreateQuery<RowType>}
	 */
	static create = (query, executeQuery, optsOrId, maybeOpts) => {
		const queryHash = hashQuery(query);
		/** @type {import('./types.js').QueryOpts<RowType>} */
		let opts;
		if (typeof optsOrId === 'string') {
			opts = {
				...maybeOpts,
				id: optsOrId
			};
		} else if (optsOrId) {
			opts = optsOrId;
		} else {
			opts = {
				id: queryHash
			};
		}
		if (!('autoScore' in opts)) {
			opts.autoScore = true;
		}

		if (!opts.disableCache) {
			/** @type {Query<RowType> | null} */
			const cached = Query.#getFromCache(queryHash);
			if (isDebug()) console.log(`Using cached query ${opts.id ?? ''}`);
			Query.#cacheCleanup();
			if (cached) return cached.value;
		} else if (isDebug()) console.log(`Not caching query ${opts.id ?? ''}`);

		Query.#constructing = true;
		const output = new Query(query, executeQuery, opts);
		if (!opts.disableCache) {
			Query.#addToCache(output);
			Query.#cacheCleanup();
		}
		return output.value;
	};

	///////////////////////
	/// </ Factories /> ///
	///////////////////////

	#debug = isDebug()
		? (/** @type {Parameters<typeof console.debug>} */ ...args) =>
				console.debug(`${(performance.now() / 1000).toFixed(3)} | ${this.id}`, ...args)
		: () => {};

	#debugStyled = isDebug()
		? (/** @type {string} */ text, /** @type {string} */ style) =>
				console.debug(`%c${(performance.now() / 1000).toFixed(3)} | ${this.id} ${text}`, style)
		: () => {};

	static #constructing = false;

	/** @type {string} */
	#id;
	/** @type {string} */
	#hash;
	/** @type {string} */
	get id() {
		return this.#id;
	}
	/** @type {string} */
	get hash() {
		return this.#hash;
	}

	/** @type {import('./types.js').Runner} */
	#executeQuery;

	/** @type {import('./types.js').QueryOpts} */
	opts;

	// TODO: Score (this should be done in another file)
	// TODO: When dealing with builder functions, add a `select` or similar
	/**
	 * @param {QueryBuilder | string} query
	 * @param {import('./types.js').Runner} executeQuery
	 * @param {import("./types.js").QueryOpts<RowType>} opts
	 * @deprecated Use {@link Query.create} instead
	 */
	constructor(query, executeQuery, opts = {}) {
		const {
			id,
			initialData = undefined,
			knownColumns = undefined,
			initialError = undefined
		} = opts;
		this.opts = opts;
		this.#executeQuery = executeQuery;

		if (typeof query !== 'string' && !(query instanceof QueryBuilder)) {
			throw new EvidenceError('Refusing to create Query, no query text provided', [
				JSON.stringify(opts)
			]);
		}

		if (!Query.#constructing) {
			console.warn(
				'Directly using new Query() is not a recommended use-case. Please use Query.create()'
			);
		}
		Query.#constructing = false; // make sure we reset it

		this.#originalText = query.toString();
		if (typeof query !== 'string') this.#query = query;
		else {
			const q = new QueryBuilder()
				.from({
					/* 
						Use of nanoid prevent ambiguity when dealing with nested Queries; 
						in theory this could be the querystring has but that's kinda gross 
					*/
					[`inputQuery-${nanoid(2)}`]: taggedSql`(${query})`
				})
				.select('*');
			this.#query = q;
		}

		this.#hash = hashQuery(this.#originalText);
		this.#id = id ?? this.#hash;
		this.#value = this.#buildProxy();

		if (initialError) {
			this.#error = initialError;
			return;
		}

		if (initialData) {
			this.#debug('Created with initial data');
			this.#hasInitialData = true;

			resolveMaybePromise(
				(d) => {
					this.#data = d;
					this.#sharedDataPromise.resolve(this);
					this.#fetchLength();
				},
				initialData,
				(e) => {
					this.#error = e;
				}
			);
		}
		if (knownColumns) {
			if (!Array.isArray(knownColumns))
				throw new Error(`Expected knownColumns to be an array`, { cause: knownColumns });
			this.#columns = knownColumns;
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
	/** @type {Set<import('./types.js').Subscriber<QueryValue<RowType>>>} */
	#subscribers = new Set();

	/**
	 * @param {import('./types.js').Subscriber<QueryValue<RowType>>} fn
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
		this.#debug(`Publishing triggered by ${source}`);
		this.#subscribers.forEach((fn) => fn(this.#value));
	};
	//////////////////////////////////////
	/// </ Implement Store Contract /> ///
	//////////////////////////////////////

	///////////////////////////////////////
	/// < EventEmitter Implementation > ///
	///////////////////////////////////////
	/** @type {import('./types.js').EventMap<QueryEvents>} */
	#handlerMap = {
		dataReady: new Set(),
		error: new Set(),
		highScore: new Set()
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
	 * @param {import('./types.js').EventHandler<QueryEvents, Event>} handler
	 */
	on = (event, handler) => {
		this.#handlerMap[event].add(handler);
	};
	/**
	 * @template {keyof QueryEvents} Event
	 * @param {Event} event
	 * @param {import('./types.js').EventHandler<QueryEvents, Event>} handler
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
		Query.create(this.#query.clone().where(sql`${filterStatement}`), this.#executeQuery, {
			knownColumns: this.#columns
		});
	/** @param {number} limit */
	limit = (limit) =>
		Query.create(this.#query.clone().limit(limit), this.#executeQuery, {
			knownColumns: this.#columns
		});
	/** @param {number} offset */
	offset = (offset) =>
		Query.create(this.#query.clone().offset(offset), this.#executeQuery, {
			knownColumns: this.#columns
		});
	/**
	 * @param {number} offset
	 * @param {number} limit
	 */
	paginate = (offset, limit) =>
		Query.create(this.#query.clone().offset(offset).limit(limit), this.#executeQuery, {
			knownColumns: this.#columns
		});

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
