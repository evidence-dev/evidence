import { initDB, setParquetURL, query } from "@evidence-dev/universal-sql/client-duckdb";

/** @type {import("./$types").LayoutLoad} */
export const load = async ({ fetch, route, data: parentData }) => {
	if (route.id && route.id !== '/settings') {
		const { customFormattingSettings, routeHash, renderedFiles } = parentData;
		const res = await fetch(`/api/${routeHash}.json`);
		// has to be cloned to bypass the proxy https://github.com/sveltejs/kit/blob/master/packages/kit/src/runtime/server/page/load_data.js#L297
		const { data } = await res.clone().json();

        await initDB();

		for (const url of renderedFiles) {
			await setParquetURL(url.split('/').at(-1).slice(0, -'.parquet'.length), url);
		}

		return {
			__db: { query },
			data,
			customFormattingSettings
		};
	}
};
