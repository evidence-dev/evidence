import { browser, building } from '$app/environment';
import { initDB, setParquetURL, query } from '@evidence-dev/universal-sql/client-duckdb';

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async ({
	fetch,
	data: { customFormattingSettings, routeHash, renderedFiles, isUserPage, evidencemeta }
}) => {
	let data = {};
	// let SSR saturate the cache first
	if (!building && browser && isUserPage) {
		const res = await fetch(`/api/${routeHash}.json`);
		if (res.ok) data = await res.json();
	}
	data.evidencemeta = evidencemeta;

	await initDB();

	for (const url of renderedFiles) {
		await setParquetURL(url.split('/').at(-1).slice(0, -'.parquet'.length), url);
	}

	return {
		__db: { query: (sql, query_name) => query(sql, { route_hash: routeHash, query_name }) },
		data,
		customFormattingSettings,
		isUserPage
	};
};
