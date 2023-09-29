import { AbstractStore } from './abstract.store.js';
import type {
	AggFunction,
	ColumnMetadata,
	MaybePromise,
	QueryResult,
	QueryStoreOpts,
	QueryStoreValue,
	Runner
} from './types.js';

import { Query, sql, count } from '@uwdata/mosaic-sql';
import { buildId } from './utils/buildId.js';
import { handleMaybePromise } from './utils/handleMaybePromise.js';
import { mutations } from './mutations/index.js';

export class QueryStore extends AbstractStore<QueryStoreValue> {
	/** Indicate that QueryStore is readable like an array */
	[index: number]: QueryResult;

	/** Internal Query Builder */
	readonly #query = new Query();

	/** Currently Held Values */
	#values: QueryResult[] = [];

	value = () => this.#proxied;

	/** Query Execution Function */
	readonly #exec: Runner;

	/**
	 * A Proxy wrapper around the QueryStore instance.
	 * It is used to intercept access to numeric indices and the 'length' property.
	 * This Proxy is responsible for triggering data fetching.
	 * When any numeric index or the 'length' property is accessed, the Proxy command triggers
	 * either the #update() or the #updateLength() function to asynchronously load or update data.
	 * Hence, only through this Proxy (i.e., #proxied), can the data fetching and length update
	 * process be triggered. Accessing the QueryStore directly does not trigger these functionalities,
	 * and hence is not recommended for normal use.
	 */
	readonly #proxied: QueryStoreValue;
	get proxy() {
		return this.#proxied;
	}

	/** Text of the query represented by this store */
	get text() {
		// TODO: This needs a formatter
		return this.#query.toString();
	}

	/** Name and Type information about the result columns */
	#columns: ColumnMetadata[] = [];
	get columns() {
		return Array.from(this.#columns);
	}

	get _evidenceColumnTypes() {
		return Array.from(this.#columns).map((ct) => ({
			name: ct.name,
			type: "STRING",
			typeFidelity: "inferred"
		}))
	}

	/** Has #fetchData been executed? */
	#loaded = false;
	get loaded() {
		return this.#loaded;
	}
	/** Is #fetchData currently running? */
	#loading = false;
	get loading() {
		return this.#loading;
	}

	/** Has #fetchLength been executed? */
	#lengthLoaded = false;
	get lengthLoaded() {
		return this.#lengthLoaded;
	}
	/** Is #fetchLength currently running? */
	#lengthLoading = false;
	get lengthLoading() {
		return this.#lengthLoading;
	}

	#length?: number;
	get length(): number {
		return this.#length ?? 0;
	}

	/**
	 * Svelte bases iteration on the `length` property; so that has to exist before it will try to pass a number
	 * However, we don't want to load everything if `length` is accessed - only the data itself.
	 * Therefore, there is a tick when the array is full of undefined, because we are still fetching.
	 * In that time period, we return this empty object so we don't get `cannot access x of undefined` errors.
	 * This may break in instances where the user may have nested arrays / dicts
	 */
	#mockResult: QueryResult = {};

	readonly id: string;

	#error: Error | unknown

	#setError = (e: Error | unknown): void => {
		console.debug(`QueryStore encountered a non-fatal error`, e)
		this.#error = e;

		if (e) {
			// This needs some testing; might cause a race, but we want to prevent the query from loading anything at this point.
			this.#length = 0;
			this.#lengthLoaded = false;
			this.#lengthLoading = false;
		}
		
		if (this.opts.errorNotifier) this.opts.errorNotifier(this.error!)

		this.publish()
	}

	get error() {
		if (this.#error !== undefined) {
			if (this.#error instanceof Error) return this.#error
			return new Error("Query encountered an error", { cause: this.#error })	
		} return undefined;
	}

	constructor(
		query: string | Query,
		exec: Runner,
		id?: string,
		private readonly opts: QueryStoreOpts = { disableCache: false },
		private readonly root?: QueryStore
	) {
		super();
		Object.freeze(opts);
		// Ensure an ID Exists
		this.id = id ?? buildId(query);

		// TODO: Strip any trailing ; from queries
		// This is hard because of comments
		// We might want to just error out if the querystring contains a ; for simplicity

		if (typeof query === 'string') {
			this.#query.from({ __userQuery: sql`(${query})` }).select('*');
		} else this.#query = query;
		// @ts-expect-error Passing undocumented parameter
		this.#exec = (...args: Parameters<Runner>) => exec(args[0], args[1] ?? this.id);
		

		this.#proxied = new Proxy<QueryStore & QueryResult[]>(
			this as unknown as QueryStore & QueryResult[],
			{
				get: (self, _prop) => {
					// Intercept numeric indices. This implies we're trying to access rows (data) in the store.
					// If the data has not been loaded, initiate the async #update method to fetch the data.
					let prop: string | symbol | number = _prop;
					if (typeof prop === 'string' && /^[\d.]+$/.exec(prop)) prop = parseInt(prop);
					if (typeof prop === 'number') {
						if (!self.#loaded) {
							try {
								const r = self.#fetchData();
								if (r instanceof Promise)
									r.catch((e) => {
										throw new Error('Failed to update query store', { cause: e });
									});
							} catch (e) {
								throw new Error('Failed to update query store', { cause: e });
							}
						}

						if (!self.#values[prop]) return self.#mockResult;
						return self.#values[prop];
					}

					// Intercept 'length' property. This implies we're trying to get the total number of rows (data) in the store.
					// If the length has not been correctly updated, initiate the async #updateLength method to calculate it.
					else if (prop === 'length' && !self.#lengthLoaded) {
						try {
							const r = self.#fetchLength();
							if (r instanceof Promise)
								r.catch((e) => {
									throw new Error('Failed to update query store length', { cause: e });
								});
						} catch (e) {
							throw new Error('Failed to update query store length', { cause: e });
						}
					}

					if (prop in self) {
						// @ts-expect-error Typescript gets mad about this for some reason
						if (typeof self[prop] === 'function') return self[prop].bind(self);
						// @ts-expect-error Typescript gets mad about this for some reason
						return self[prop];
					}

					// TODO: Should we handle things that mutate the data like pop, push, etc

					// @ts-expect-error Typescript gets mad about accessing non-numeric keys of an array dynamically (e.g. pop, push)
					if (typeof self.#values[prop] === 'function') {
						// @ts-expect-error Typescript gets mad about accessing non-numeric keys of an array dynamically (e.g. pop, push)
						return self.#values[prop].bind(self.#values);
					}
					// @ts-expect-error Typescript gets mad about accessing non-numeric keys of an array dynamically (e.g. pop, push)
					return self.#values[prop];
				}
			}
		);
		// TODO: Should this really be automatic?
		this.#fetchMetadata();
		this.#handleInitialData();
	}

	#handleInitialData = () => {
		const { initialData, initialDataDirty } = this.opts;
		// Maintain loading state while we wait
		if (initialData && !this.#values.length) {
			this.#loading = true;
			this.#lengthLoading = true;
			this.#length = 0;
			this.publish();
			if (initialData instanceof Promise) {
				initialData.then((results) => {
					this.#values = results;
					this.#length = results.length;
					this.#loading = false;
					this.#lengthLoading = false;
					this.#loaded = !initialDataDirty;
					this.#lengthLoaded = !initialDataDirty;
					this.publish();
					if (initialDataDirty || !this.#values.length) this.#fetchData();
				});
			} else {
				this.#values = initialData;
				this.#length = initialData.length;
				this.#loading = false;
				this.#lengthLoading = false;
				this.#loaded = !initialDataDirty;
				this.#lengthLoaded = !initialDataDirty;
				this.publish();
				if (initialDataDirty || !this.#values.length) this.#fetchData();
			}
		}
	};

	/** Force the QueryStore to fetch data */
	fetch = () => this.#fetchData();

	#fetchData = () => {
		if (this.#loading || this.#loaded) {
			return;
		}
		if (this.#error) {
			console.debug("Refusing to execute data query; store has an error state.")
			return;
		}
		this.#loading = true;
		this.publish();

		const queryWithComment = `--data\n${this.#query.toString()}`;

		return handleMaybePromise<QueryResult[], unknown>((result) => {
			this.#values = result;
			this.#loading = false;
			this.#loaded = true;
			return this.#fetchLength();
		}, () => this.#exec(queryWithComment), this.#setError);

	};

	#fetchLength = () => {
		if (this.#lengthLoading || this.#lengthLoaded) {
			return;
		}
		if (this.#error) {
			console.debug("Refusing to execute length query; store has an error state.")
			return;
		}
		

		// No need to run the length query if we already have the values available
		if (!this.#values.length && this.#loaded) {
			this.#length = this.#values.length;
			this.#lengthLoaded = true;
			this.publish();
			return;
		}
		
		this.#lengthLoading = true;
		this.publish();

		const countQuery = new Query()
			.with({ original: this.#query })
			.select({ length: count('*') })
			.from('original');
		const queryWithComment = `--len\n${countQuery}`;

		return handleMaybePromise<QueryResult[], unknown>((result) => {
			const [row] = result;

			this.#length = row.length as number;
			this.#lengthLoaded = true;
			this.#lengthLoading = false;

			this.publish();
		}, () => this.#exec(queryWithComment), this.#setError);
	};

	#fetchMetadata = () => {
		if (this.#error) {
			console.debug("Refusing to execute metadata query; store has an error state.")
			return;
		}
		
		return handleMaybePromise((queryResult: QueryResult[]) => {
			this.#columns = queryResult.map((row) => ({
				name: row.column_name!.toString(),
				type: row.column_type!.toString()
			}));
			this.#mockResult = Object.fromEntries(this.#columns.map((c) => [c.name, null]));

			this.publish();
		}, () => this.#exec(`--col-metadata\nDESCRIBE ${this.#query.toString()}`), this.#setError);
	};

	/////////
	// Builder Methods
	/////////

	/**
	 * Shared cache of existing QueryStores to reduce the number of stores initialized
	 */
	private static cache: Record<string, QueryStore> = {};

	/**
	 * Array of child ids that the store is currently subscribed to.
	 * @todo: need to clean up subscriptions if/when stores are gc'd
	 */
	#subscriptions: string[] = [];

	/**
	 * Wraps an derivation function with memoization provided by {@link QueryStore.cache}
	 */
	#withStoreCache = (aggKey: string, aggFunc: AggFunction, passCurrentAsInitial = false) => {
		return (...args: unknown[]) => {
			// Build a unique ID for the target child store
			const newQuery = aggFunc(this.#query.clone(), ...args);

			const id = buildId(newQuery.toString());

			// If there is a root; subscription operations will function against that
			// If there isn't; then this is a root
			const subscriber = this.root ?? this;

			// If caching is enabled and the id exists in the cache
			if (id in QueryStore.cache && !this.opts.disableCache) {
				// Use the cache
				const cachedQuery = QueryStore.cache[id];

				if (!subscriber.#subscriptions.includes(id)) {
					cachedQuery.subscribe(subscriber.publish);
					subscriber.#subscriptions.push(id);
				}

				return cachedQuery.#proxied;
			}
			// Construct a new store, subscribe and cache it
			const newStore = new QueryStore(
				newQuery,
				this.#exec,
				id,
				{
					...this.opts,
					initialData: passCurrentAsInitial ? this.#values : undefined,
					initialDataDirty: true
				},
				this.root ?? this
			);

			subscriber.#subscriptions.push(id);
			newStore.subscribe(subscriber.publish);
			QueryStore.cache[id] = newStore;
			return newStore.#proxied;
		};
	};

	where = this.#withStoreCache('where', mutations.where as AggFunction);
	groupBy = this.#withStoreCache('groupBy', mutations.groupBy as AggFunction);
	agg = this.#withStoreCache('agg', mutations.agg as AggFunction);
	orderBy = this.#withStoreCache('orderBy', mutations.orderBy as AggFunction, true);
	limit = this.#withStoreCache('limit', (q, l) => q.limit(l), true);
	offset = this.#withStoreCache('offset', (q, l) => q.offset(l), true);
}
