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
	data: { customFormattingSettings, routeHash, isUserPage, evidencemeta }
}) => {
	if (!browser) await database_initialization;

	const data = {};

	// let SSR saturate the cache first
	if (browser && isUserPage) {
		const page_queries_promise = Promise.all(
			evidencemeta.queries?.map(async ({ id }) => {
				const res = await fetch(`/api/${routeHash}/${id}.arrow`);
				if (res.ok) data[id] = (await tableFromIPC(res)).toArray();
			}) ?? []
		);

		const component_queries_promise = (async () => {
			const res = await fetch(`/api/${routeHash}/all-queries.json`);
			const arr = await (res.ok ? res.json() : []);

			const set = new Set(arr);
			evidencemeta.queries?.forEach(({ id }) => set.delete(id));
			const component_queries = Array.from(set);

			return Promise.all(
				component_queries.map(async (id) => {
					const res = await fetch(`/api/${routeHash}/${id}.arrow`);
					if (res.ok) data[id] = (await tableFromIPC(res)).toArray();
				})
			);
		})();

		await Promise.all([component_queries_promise, page_queries_promise]);
	}

	return {
		__db: {
			query(sql, query_name) {
				if (browser) {
					return database_initialization.then(() => query(sql));
				}

				return query(sql, { route_hash: routeHash, query_name, prerendering: building });
			}
		},
		data,
		customFormattingSettings,
		isUserPage,
		evidencemeta
	};
};
