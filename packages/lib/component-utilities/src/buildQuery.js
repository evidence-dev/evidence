import { setContext, getContext } from 'svelte';
import { Query as QueryBuilder, sql } from '@uwdata/mosaic-sql';
import { Query, resolveMaybePromise } from '@evidence-dev/sdk/usql';
import { query } from '@evidence-dev/universal-sql/client-duckdb';
import { derived, writable } from 'svelte/store';

const QUERY_CONTEXT_KEY = '___usql_query';
/**
 * Defaults to the query function from universal sql
 * @type {(x: string) => Query}
 */
let queryFunction = query;

export const setQueryFunction = (queryFn) => {
	setContext(QUERY_CONTEXT_KEY, queryFn);
	queryFunction = queryFn;
};

export const getQueryFunction = () => getContext(QUERY_CONTEXT_KEY);

/**
 * @typedef QueryProps
 * @property {string} [value] Column to be used as value when selected
 * @property {string} [label] (optional) Column to be used as label for each value
 * @property {string | string[] | Record<string, string>} [select] (optional) any additional fields to include (e.g. not value or label)
 * @property {string | import("@evidence-dev/sdk/usql").QueryValue} [data] Table or subquery to select from
 * @property {string} [where] (optional) Where clause for dataset
 * @property {string} [order] (optional) Order by clause for dataset
 */

/**
 * @param {QueryProps} queryProps
 * @param {string} id
 * @param {Array<Record<string,unknown>>} initialData
 * @example export let value, data, label, order, where;
 *  $: queryProps = {value, data, label, order, where}
 *	const {results, update} = buildReactiveInputQuery(queryProps, `id`, $page.data.data[`id`])
 *	$: update({value, data, label, order, where})
 *	$: ({hasQuery, query} = $results)
 */
export const buildReactiveInputQuery = (queryProps, id, initialData) => {
	const internal = writable(buildInputQuery(queryProps, id, initialData));

	let currentQuery;
	return {
		results: derived(internal, (v) => v),
		update: async (queryProps) => {
			const { hasQuery, query } = buildInputQuery(queryProps, id);

			if (!hasQuery) {
				internal.set({ hasQuery: false });
			} else {
				// We can run .fetch() with wreckless abandon because if the query
				// has already been fetched (e.g. hasn't changed), then this
				// is basically a no-op
				resolveMaybePromise(() => {
					if (query.hash !== currentQuery?.hash) {
						currentQuery = query;
						internal.set({ hasQuery, query });
					}
				}, query.fetch());
			}
		}
	};
};

/**
 * @param {QueryProps} opts
 * @param {string} id
 * @returns { { hasQuery: false } | { hasQuery: true, query: Query } }
 * @deprecated Prefer buildReactiveInputQuery
 */
export const buildInputQuery = ({ value, label, select, data, where, order }, id, initialData) => {
	if (!data || !(value || select)) return { hasQuery: false };

	let parentHasNoResolve = false;
	const q = new QueryBuilder().distinct();
	if (value) q.select({ value: sql`${value}` });
	if (label) {
		q.select({ label: sql`${label}` });
	} else {
		q.select({ label: sql`${value}` });
	}
	if (select) q.select(select);

	if (typeof data === 'string') {
		if (data.trim().match(/^[\w]+$/)) {
			// This is a table name
			q.from(data.trim());
		} else {
			// This is probably a subquery, or just broken
			q.from(sql(data.trim()));
		}
	} else if (Query.isQuery(data)) {
		// data is a QueryStore
		// use that as a subquery
		q.from(sql`(${data.text})`);
		parentHasNoResolve = data.opts.noResolve ?? false;
	} else {
		return { hasQuery: false };
	}

	if (where) {
		q.where(where);
	}

	if (order) {
		q.orderby(sql`${order}`);
		q.select({
			ordinal: sql`row_number() over (ORDER BY ${order})`
		});
	}

	const newQuery = buildQuery(q.toString(), id, initialData, { noResolve: parentHasNoResolve });
	// Don't make the component author bother with this, just provide the data
	newQuery.fetch();
	return {
		hasQuery: true,
		query: newQuery
	};
};

/**
 *
 * @param {string} queryString
 * @param {string} id
 * @param {any[]} initialData
 * @param {Omit<import('@evidence-dev/sdk/usql').QueryOpts, 'initialData'>} [opts]
 *
 * @returns {Query}
 */
export const buildQuery = (queryString, id, initialData, opts) => {
	return Query.create(queryString, queryFunction, id, { ...opts, initialData });
};
