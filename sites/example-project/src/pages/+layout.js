import { browser } from '$app/environment';
import {
	tableFromIPC,
	initDB,
	setParquetURLs,
	query,
	updateSearchPath
} from '@evidence-dev/universal-sql/client-duckdb';

const database_initialization = (async () => {
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
})();

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async ({
	fetch,
	data: { customFormattingSettings, routeHash, isUserPage, evidencemeta }
}) => {
	if (!browser) await database_initialization;

	const data = {};

	// saturate the cache
	if (!browser && isUserPage) {
		await Promise.all(
			evidencemeta.queries?.map(({ id }) => fetch(`/api/${routeHash}/${id}.arrow`)) ?? []
		);
	}

	// let SSR saturate the cache first
	if (browser && isUserPage) {
		await Promise.all(
			evidencemeta.queries?.map(async ({ id }) => {
				const res = await fetch(`/api/${routeHash}/${id}.arrow`);
				if (res.ok) data[id] = (await tableFromIPC(res)).toArray();
			}) ?? []
		);
	}

	return {
		__db: {
			query(sql, query_name) {
				if (browser) {
					return database_initialization.then(() => query(sql));
				} else {
					// during SSR, add cache instructions so prerendering works properly
					return query(sql, { route_hash: routeHash, query_name });
				}
			}
		},
		data,
		customFormattingSettings,
		isUserPage,
		evidencemeta
	};
};
