import { Query as QueryBuilder, sql } from '@uwdata/mosaic-sql';
import { Query } from '../../usql/index.js';
import { writable, readonly } from 'svelte/store';

// We "singleton" the execution function so that component authors don't need to worry about where it is coming from, only that it exists
/**
 * @type {import("../../usql/types.js").Runner | undefined}
 */
let queryFn;
/**
 * @param {import("../../usql/types.js").Runner} _queryFn
 */
export const setQueryFunction = (_queryFn) => {
	queryFn = _queryFn;
};
export const getQueryFunction = () => queryFn;

/** @type {import("../inputs/InputStore.js").InputStore | undefined} */
let inputStore;

/**
 *
 * @param {import("../inputs/InputStore.js").InputStore} _inputStore
 */
export const setInputStore = (_inputStore) => {
	inputStore = _inputStore;
};
export const getInputStore = () => inputStore;

/**
 *
 * @param {string} id
 * @param {unknown[]} initialData
 * @returns
 * @todo: can we access the initialData ourselves to abstract that away from the user?
 */
export const useInputQuery = (id, initialData) => {
	const results = writable();
	if (!queryFn) throw new Error('No query runner found');
	if (!inputStore) throw new Error('No input store found');
	/**
	 * @param {import("./types.js").InputQueryOpts} opts
	 * @returns {string | null}
	 */

	const transformOptionsToSQL = ({ value, label, select, data, where, order }) => {
		if (!data || !(value || select)) return null;
		const builder = new QueryBuilder().distinct();

		if (value) builder.select({ value: sql`${value}` });
		if (label) {
			builder.select({ label: sql`${label}` });
		} else {
			builder.select({ label: sql`${value}` });
		}
		if (select) builder.select(select);

		if (typeof data === 'string') {
			if (data.trim().match(/^[\w]+$/)) {
				// This is a table name
				builder.from(data.trim());
			} else {
				// This is probably a subquery, or just broken
				builder.from(sql(data.trim()));
			}
		} else if (Query.isQuery(data)) {
			// data is a QueryStore
			// use that as a subquery
			builder.from(sql`(${data.text})`);
			// parentHasNoResolve = data.opts.noResolve ?? false;
		} else {
			return null;
		}

		if (where) {
			builder.where(where);
		}

		if (order) {
			builder.orderby(sql`${order}`);
			builder.select({
				ordinal: sql`row_number() over (ORDER BY ${order})`
			});
		}

		return builder.toString();
	};

	const updateQuery = Query.create(
		id,
		{
			execFn: queryFn,
			dagManager: inputStore,
			callback: (v) => results.set({ hasQuery: true, query: v })
		},
		{
			initialData
		}
	);
	return {
		get update() {
			if (!inputStore) throw new Error('No input store found');
			const self = this;
			const tx = inputStore.listen();
			console.log('%cCreating Transaction', 'color: red; font-size: 32pt; font-weight: bold;');
			/**
			 * @param {import("./types.js").InputQueryOpts} opts
			 */
			return (opts) => {
				if (this !== self)
					throw new Error(
						"You must call 'update' from the builder object, it cannot be destructured"
					);
				if (!inputStore) throw new Error('No input store found');
				if (!tx) throw new Error('No tx found');
				console.log('%cCollecting Transaction', 'color: red; font-size: 32pt; font-weight: bold;');
				const inputDeps = inputStore.unlisten(tx);

				const sqlText = transformOptionsToSQL(opts);
				if (!sqlText) {
					results.set({ hasQuery: false });
					return;
				}
				updateQuery(() => sqlText);

				// TODO: Depenedency tracking
			};
		},
		results: readonly(results)
	};
};

/**
 *
 * @param {import("./types.js").InputQueryOpts} opts
 * @param {string} id
 * @param {unknown[]} initialData
 * @returns {{ hasQuery: false } | { hasQuery: true, query: import('../../usql/query/Query.js').QueryValue, update: (opts: import('./types.js').InputQueryOpts) => void }}
 */
export const buildInputQuery = (opts, id, initialData) => {
	if (!queryFn) throw new Error('No query runner found');
	if (!inputStore) throw new Error('No input store found');
	let parentHasNoResolve = false;

	/** @type {import('../../usql/query/Query.js').QueryValue | null} */
	let q = null;
	const runQuery = Query.create(
		id,
		{
			callback: (v) => (q = v),
			dagManager: inputStore,
			execFn: queryFn
		},
		{
			initialData,
			noResolve: parentHasNoResolve
		}
	);
	const initialQuery = transformOptionsToSQL(opts).toString();
	runQuery(() => initialQuery);

	return {
		hasQuery: true,
		get query() {
			if (!q) throw new Error('Failed to create Query');
			return q;
		},
		update: (opts) => {
			runQuery(() => transformOptionsToSQL(opts).toString());
		}
	};
};
export const buildQuery = () => {};
