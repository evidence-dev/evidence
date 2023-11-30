import { setContext, getContext } from 'svelte';
import { Query, sql } from '@uwdata/mosaic-sql';
import { QueryStore } from '@evidence-dev/query-store';

const QUERY_CONTEXT_KEY = '___usql_query';
/** @type {(x: string) => QueryStore} */
let queryFunction = () => {
	throw new Error('Query Function has not yet been set. Use setQueryFunction first.');
};

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
 * @param {QueryProps} opts
 * @param {string} id
 * @returns { { hasQuery: false } | { hasQuery: true, query: QueryStore } }
 */
export const buildInputQuery = ({ value, label, select, data, where, order }, id) => {
	if (!data || !(value || select)) return { hasQuery: false };

	const q = new Query().distinct();
	if (value) q.select({ value: sql`${value}` });
	if (label) q.select({ label: sql`${label}` });
	if (select) q.select(select);

	if (typeof data === 'string') {
		if (data.trim().match(/^[\w]+$/)) {
			// This is a table name
			q.from(data.trim());
		} else {
			// This is probably a subquery, or just broken
			q.from(sql(data.trim()));
		}
	} else {
		// data is a QueryStore
		// use that as a subquery
		q.with({ subQuery: sql`${data.text}` }).from('subQuery');
	}

	if (where) {
		q.where(where);
	}

	if (order) {
		q.orderby(order);
	}

	const newQuery = buildQuery(q.toString(), id);
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
 *
 * @returns {QueryStore}
 */
export const buildQuery = (queryString, id) => {
	return new QueryStore(queryString, queryFunction, id);
};
