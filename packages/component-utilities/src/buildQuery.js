import { setContext, getContext } from 'svelte';
import { Query, sql } from '@uwdata/mosaic-sql';
import { QueryStore } from '@evidence-dev/query-store';
import { query } from '@evidence-dev/universal-sql/client-duckdb';
import { derived, writable } from 'svelte/store';

const QUERY_CONTEXT_KEY = '___usql_query';
/**
 * Defaults to the query function from universal sql
 * @type {(x: string) => QueryStore}
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
 * @property {string | QueryStore} [data] Table or subquery to select from
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

	return {
		results: derived(internal, (v) => v),
		update: async (queryProps) => {
			const { hasQuery, query } = buildInputQuery(queryProps, id);
			if (!hasQuery) {
				internal.set({ hasQuery: false });
			} else {
				internal.update(async (currentQuery) => {
					if (query.hash !== currentQuery) await query.fetch()
					internal.set({ hasQuery, query });
				})
			}
		}
	};
};

/**
 * @param {QueryProps} opts
 * @param {string} id
 * @returns { { hasQuery: false } | { hasQuery: true, query: QueryStore } }
 * @deprecated Prefer buildReactiveInputQuery
 */
export const buildInputQuery = ({ value, label, select, data, where, order }, id, initialData) => {
	if (!data || !(value || select)) return { hasQuery: false };

	const q = new Query().distinct();
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
	} else if (data instanceof QueryStore || data.__isQueryStore) {
		// data is a QueryStore
		// use that as a subquery
		q.from(sql`(${data.text})`);
	} else {
		return { hasQuery: false };
	}

	if (where) {
		q.where(where);
	}

	if (order) {
		q.orderby(order);
	}

	const newQuery = buildQuery(q.toString(), id, initialData);
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
 *
 * @returns {QueryStore}
 */
export const buildQuery = (queryString, id, initialData) => {
	return QueryStore.create(queryString, queryFunction, id, { initialData });
};
