import { browser, building, dev } from '$app/environment';
import {
	tableFromIPC,
	initDB,
	setParquetURLs,
	query,
	updateSearchPath,
	arrowTableToJSON
} from '@evidence-dev/universal-sql/client-duckdb';
import { profile } from '@evidence-dev/component-utilities/profile';

const loadDB = async () => {
	let renderedFiles = {};

	if (!browser) {
		const { readFile } = await import('fs/promises');
		({ renderedFiles } = JSON.parse(
			await readFile('./static/data/manifest.json', 'utf-8').catch(() => '{}')
		));
	} else {
		const res = await fetch('/data/manifest.json');
		if (res.ok) ({ renderedFiles } = await res.json());
	}

	if (!renderedFiles) {
		throw new Error('Unable to load source manifest. Do you need to run build:sources?');
	}

	await profile(initDB);
	await profile(setParquetURLs, renderedFiles);
	await profile(updateSearchPath, Object.keys(renderedFiles));
};

const database_initialization = profile(loadDB);

/** @type {(...params: Parameters<import("./$types").LayoutLoad>) => Promise<App.PageData["data"]>} */
async function getPrerenderedQueries({ data: { routeHash, paramsHash }, fetch }) {
	// get every query that's run in the component
	const res = await fetch(`/api/${routeHash}/${paramsHash}/all-queries.json`);
	if (!res.ok) return {};

	const sql_cache_with_hashed_query_strings = await res.json();

	const resolved_entries = await Promise.all(
		Object.entries(sql_cache_with_hashed_query_strings).map(async ([query_name, query_hash]) => {
			const res = await fetch(`/api/prerendered_queries/${query_hash}.arrow`);
			if (!res.ok) return null;

			const table = await tableFromIPC(res);
			return [query_name, arrowTableToJSON(table)];
		})
	);

	return Object.fromEntries(resolved_entries.filter(Boolean));
}

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async (event) => {
	const {
		data: { customFormattingSettings, routeHash, paramsHash, isUserPage, evidencemeta }
	} = event;

	if (!browser) await database_initialization;
	// account for potential changes in manifest (source query hmr)
	if (!browser && dev) await initDB();

	/** @type {App.PageData["data"]} */
	let data = {};

	// let SSR saturate the cache first
	if (browser && isUserPage) {
		data = await getPrerenderedQueries(event);
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
			},
			async updateParquetURLs(manifest) {
				// todo: maybe diff with old?
				const { renderedFiles } = JSON.parse(manifest);
				await profile(setParquetURLs, renderedFiles);
			}
		},
		data,
		customFormattingSettings,
		isUserPage,
		evidencemeta
	});
};
