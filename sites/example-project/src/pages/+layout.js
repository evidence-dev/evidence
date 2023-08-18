import { browser, building } from '$app/environment';
import {
	tableFromIPC,
	initDB,
	setParquetURLs,
	query,
	updateSearchPath
} from '@evidence-dev/universal-sql/client-duckdb';
import { profile } from '@evidence-dev/component-utilities/profile';

const initDb = async () => {
	let renderedFiles = {};

	if (!browser) {
		const { readFile } = await import('fs/promises');
		({ renderedFiles } = JSON.parse(
			await readFile('../../static/data/manifest.json', 'utf-8').catch(() => '{}')
		));
	} else {
		const res = await fetch('/data/manifest.json');
		if (res.ok) ({ renderedFiles } = await res.json());
	}

	await initDB();
	await setParquetURLs(renderedFiles);
	await updateSearchPath(Object.keys(renderedFiles));
};

const database_initialization = profile(initDb);

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async ({
	fetch,
	data: { customFormattingSettings, routeHash, paramsHash, isUserPage, evidencemeta }
}) => {
	if (!browser) await database_initialization;

	const data = {};

	// let SSR saturate the cache first
	if (browser && isUserPage) {
		const page_queries_promise = Promise.all(
			evidencemeta.queries?.map(async ({ id, compiledQueryString }) => {
				// see explanation below
				const additional_hash = /\${.*?}/s.test(compiledQueryString) ? paramsHash : routeHash;

				const res = await fetch(`/api/${routeHash}/${additional_hash}/${id}.arrow`);
				if (res.ok) data[id] = (await tableFromIPC(res)).toArray();
			}) ?? []
		);

		const component_queries_promise = (async () => {
			// get every query that's run in the component
			const res = await fetch(`/api/${routeHash}/all-queries.json`);
			const arr = await (res.ok ? res.json() : []);

			// remove all the queries that are already in evidencemeta.queries
			// because they will be fetched in page_queries_promise
			const set = new Set(arr);
			evidencemeta.queries?.forEach(({ id }) => set.delete(id));
			const component_queries = Array.from(set);

			return Promise.all(
				component_queries.map(async (query_name) => {
					// we have no way of knowing if page parameters are used in component queries
					// so they should always use paramsHash
					const res = await fetch(`/api/${routeHash}/${paramsHash}/${query_name}.arrow`);
					if (res.ok) data[query_name] = (await tableFromIPC(res)).toArray();
				})
			);
		})();

		await Promise.all([component_queries_promise, page_queries_promise]);
	}

	return /** @type {App.PageData} */ ({
		__db: {
			query(sql, { query_name, callback = (x) => x }) {
				if (browser) {
					return (async () => {
						await database_initialization;
						const result = await query(sql);
						return callback(result);
					})();
				}

				// if the query interpolates variables then we need to make each page
				// have a unique prerendered query in case it interpolates $page.params
				// if the query isn't in evidencemeta.queries it's a component query which
				// is always interpolated, so count that as true
				const evidencemeta_query = evidencemeta.queries?.find(({ id }) => id === query_name);
				const additional_hash =
					evidencemeta_query == undefined || /\${.*?}/s.test(evidencemeta_query.compiledQueryString)
						? paramsHash
						: routeHash;

				return callback(
					query(sql, {
						route_hash: routeHash,
						additional_hash,
						query_name,
						prerendering: building
					})
				);
			},
			async load() {
				return database_initialization;
			}
		},
		data,
		customFormattingSettings,
		isUserPage,
		evidencemeta
	});
};
