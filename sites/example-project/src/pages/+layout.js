import { browser, building } from '$app/environment';
import {
	tableFromIPC,
	initDB,
	setParquetURLs,
	query,
	updateSearchPath,
	arrowTableToJSON
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

	if (!renderedFiles) {
		throw new Error('Unable to load source manifest. Do you need to run build:sources?');
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
		const queries_promise = (async () => {
			// get every query that's run in the component
			const res = await fetch(`/api/${routeHash}/${paramsHash}/all-queries.json`);
			if (!res.ok) return;
			const sql_cache_with_hashed_query_strings = await res.json();

			return Promise.all(
				Object.entries(sql_cache_with_hashed_query_strings).map(
					async ([query_name, query_hash]) => {
						const res = await fetch(`/api/prerendered_queries/${query_hash}.arrow`);
						if (!res.ok) return;

						const table = await tableFromIPC(res);
						data[query_name] = arrowTableToJSON(table);
					}
				)
			);
		})();

		await queries_promise;
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

				return callback(
					query(sql, {
						route_hash: routeHash,
						additional_hash: paramsHash,
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
