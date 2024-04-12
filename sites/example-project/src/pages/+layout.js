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
import { toasts } from '@evidence-dev/component-utilities/stores';

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
	await profile(initDB);

	if (Object.keys(renderedFiles ?? {}).length === 0) {
		console.warn(`Unable to load manifest, do you need to generate sources?`.trim());
		toasts.add(
			{
				id: 'MissingManifest',
				status: 'warning',
				title: 'Missing Manifest',
				message: 'Without a manifest file, no data is available'
			},
			10000
		);
	} else {
		await profile(setParquetURLs, renderedFiles);
		await profile(updateSearchPath, Object.keys(renderedFiles));
	}
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

/** @satisfies {import("./$types").LayoutServerLoad} */
async function missingDataJSON({ fetch, route, params }) {
	const [{ default: md5 }, customFormattingSettings, pagesManifest, evidencemeta] =
		await Promise.all([
			import('blueimp-md5'),
			fetch('/api/customFormattingSettings.json/GET.json').then((x) => x.json()),
			fetch('/api/pagesManifest.json').then((x) => x.json()),
			fetch(`/api/${route.id}/evidencemeta.json`).then((x) => (x.ok ? x.json() : { queries: [] }))
		]);

	const routeHash = md5(route.id);
	const paramsHash = md5(
		Object.entries(params)
			.sort()
			.map(([key, value]) => `${key}\x1F${value}`)
			.join('\x1E')
	);

	return {
		routeHash,
		paramsHash,
		customFormattingSettings,
		evidencemeta,
		pagesManifest
	};
}

const system_routes = ['/settings', '/explore'];

/** @type {Map<string, { inputs: Record<string, string> }>} */
const dummy_pages = new Map();

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async (event) => {
	const isUserPage =
		event.route.id &&
		system_routes.every((system_route) => !event.route.id.startsWith(system_route));

	if (!event.data) {
		event.data = await missingDataJSON(event);
	}

	const {
		data: { customFormattingSettings, routeHash, paramsHash, evidencemeta, pagesManifest },
		url,
		fetch
	} = event;

	/** @type {App.PageData["data"]} */
	let data = {};
	const { inputs = {} } = dummy_pages.get(url.pathname) ?? {};

	const is_dummy_page = dummy_pages.has(url.pathname);
	if ((dev || building) && !browser && !is_dummy_page) {
		dummy_pages.set(url.pathname, { inputs });
		await fetch(url);
		dummy_pages.delete(url.pathname);
	}

	if (!browser) await database_initialization;
	// account for potential changes in manifest (source query hmr)
	if (!browser && dev) await initDB();

	// let SSR saturate the cache first
	if (browser && isUserPage) {
		data = await getPrerenderedQueries(event);
	}

	return /** @type {App.PageData} */ ({
		__db: {
			query(sql, { query_name, callback = (x) => x } = {}) {
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
		inputs: new Proxy(inputs, {
			get(target, prop) {
				if (typeof prop === 'symbol') return undefined;
				if (prop === 'then') return undefined;
				if (prop === 'loading') return undefined;
				if (prop === 'error') return undefined;
				if (prop === '_evidenceColumnTypes') return undefined;
				if (prop === '__isQueryStore') return false;
				return target[prop] ?? recursiveFillerObject;
			},
			set(target, prop, value) {
				target[prop] = value;
				return true;
			}
		}),
		data,
		customFormattingSettings,
		isUserPage,
		evidencemeta,
		pagesManifest
	});
};

const recursiveFillerObject = new Proxy(
	{},
	{
		get(target, prop) {
			if (prop === '__unset') return true;
			if (typeof prop === 'symbol') return undefined;
			if (prop === 'then') return undefined;
			if (prop === 'loading') return undefined;
			if (prop === 'error') return undefined;
			if (prop === '_evidenceColumnTypes') return undefined;
			if (prop === 'toString') return () => 'null';
			return recursiveFillerObject;
		}
	}
);
