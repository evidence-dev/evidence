// @ts-nocheck Adding nocheck because type errors in this file were failing the build and @ItsMeBrianD told said this code is dead

import { getContext } from 'svelte';
import { ALL_QUERIES_CONTEXT_KEY, QUERIES_CONTEXT_KEY } from '$evidence/contextKeys';
import { Query } from '@evidence-dev/sdk/usql';
import { query } from '@evidence-dev/universal-sql/client-duckdb';
import { derived } from 'svelte/store';

let ssrHookInstalled = false;
/**
 *
 * @param {boolean} isInstalled
 * @returns
 */
export const setSsrHookState = (isInstalled) => {
	ssrHookInstalled = isInstalled;
};

/**
 *
 * @param {string} sql
 * @param {string} id
 * @returns
 */
const runner = (sql, id) => query(sql, { query_name: id, prerendering: true, route_hash: '500' });

/**
 * @param {string} name
 * @param {string} sql
 * @param {import('@evidence-dev/sdk/usql').QueryOpts} [opts]
 */
export const runQuery = (name, sql, opts) => {
	let initialData = undefined;
	let initialError = undefined;

	try {
		if (typeof window === 'undefined') {
			// SSR
			if (ssrHookInstalled) initialData = query(sql);
		} else {
			const ssrKey = btoa(sql);
			if (
				window.__evidence_ssr &&
				name in window.__evidence_ssr &&
				sql === window.__evidence_ssr[ssrKey].initialQuery
			) {
				initialData = window.__evidence_ssr[ssrKey].data;
				Object.defineProperty(initialData, '_evidenceColumnTypes', {
					enumerable: false,
					value: window.__evidence_ssr[ssrKey].columns
				});
			}
		}
	} catch (e) {
		initialError = new Error(`Error encountered while running query ${name}`, { cause: e });
	}

	return Query.create(sql, runner, { ...opts, initialData, initialError, id: name });
};

/**
 * @returns {import("svelte/store").Readable<Record<string, import('@evidence-dev/sdk/usql').QueryValue>>}
 */
export const getQueries = () => {
	/** @type {import("svelte/store").Readable<Record<string,string>>} */
	const context = getContext(QUERIES_CONTEXT_KEY);

	/** @type {Record<string,import('@evidence-dev/sdk/usql').QueryValue<any>>} */
	const queries = {};
	const proxy = new Proxy(queries, {
		/**
		 * @param {Record<string,Query>} t
		 * @param {*} p
		 * @returns
		 */
		get(t, p) {
			if (p in t) return t[p];
			return Query.create(p, runner, {
				id: p,
				initialError: new Error(`Query ${p} is not available in this context`),
				disableCache: true
			});
		}
	});

	return derived(
		context,
		(
			/** @type {Record<string,string>}  */ availableQueries,
			/** @type {(x: Record<string,Query>) => void} */ set
		) => {
			/** @type {Array<Promise<unknown> | unknown>} */
			const updates = [];
			Object.entries(availableQueries).forEach(([k, v]) => {
				// Don't use $app/environment as that creates a hard dep on SvelteKit
				// We want this to be portable to plain svelte projects
				let initialData = undefined;
				if (!(k in queries)) {
					if (typeof window === 'undefined') {
						// SSR
						if (ssrHookInstalled) initialData = query(v);
					} else {
						const ssrKey = btoa(v);

						if (
							window.__evidence_ssr &&
							ssrKey in window.__evidence_ssr &&
							v === window.__evidence_ssr[ssrKey].initialQuery
						) {
							initialData = window.__evidence_ssr[ssrKey].data;
							Object.defineProperty(initialData, '_evidenceColumnTypes', {
								enumerable: false,
								value: window.__evidence_ssr[ssrKey].columns
							});
						}
					}
				}

				const newStore = Query.create(v, runner, {
					initialData,
					id: k
				});

				if (queries[k]?.hash !== newStore.hash) {
					updates.push(
						// Loading states appear after 500ms
						Promise.race([
							newStore.fetch(),
							new Promise((r) => {
								setTimeout(r, 500);
							})
						]).then(() => (queries[k] = newStore))
					);
					// Has updated
					queries[k] = newStore;
				}
			});

			Promise.all(updates).then(() => set(proxy));
			return proxy;
		},
		proxy
	);
};

export const getAllQueries = () => getContext(ALL_QUERIES_CONTEXT_KEY);

/** @deprecated Use Query instead of QueryStore */
const QueryStore = Query;
export { QueryStore };
