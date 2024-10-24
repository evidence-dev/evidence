import { browser, building, dev } from '$app/environment';
import {
	tableFromIPC,
	initDB,
	setParquetURLs,
	query as usqlQuery,
	updateSearchPath,
	arrowTableToJSON
} from '@evidence-dev/universal-sql/client-duckdb';
import { profile } from '@evidence-dev/component-utilities/profile';
import { toasts } from '@evidence-dev/component-utilities/stores';
import { setTrackProxy } from '@evidence-dev/sdk/usql';
import md5 from 'blueimp-md5';

export const ssr = !dev;
export const prerender = import.meta.env.VITE_EVIDENCE_SPA !== 'true';
export const trailingSlash = 'always';

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
		console.warn(`No sources found, execute "npm run sources" to generate`.trim());
		if (dev) {
			toasts.add(
				{
					id: 'MissingManifest',
					status: 'warning',
					title: 'No Sources Found',
					message: 'Configure and run sources to include data in your project.'
				},
				10000
			);
		}
	} else {
		await profile(setParquetURLs, renderedFiles);
		await profile(updateSearchPath, Object.keys(renderedFiles));
	}
};

const database_initialization = profile(loadDB);

/**
 *
 * @param {string} routeHash
 * @param {string} paramsHash
 * @param {typeof fetch} fetch
 * @returns {Promise<Record<string, unknown[]>>}
 */
async function getPrerenderedQueries(routeHash, paramsHash, fetch) {
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

const system_routes = ['/settings', '/explore'];

/** @type {Map<string, { inputs: Record<string, string> }>} */
const dummy_pages = new Map();

/** @satisfies {import("./$types").LayoutLoad} */
export const load = async ({ fetch, route, params, url }) => {
	const [{ customFormattingSettings }, pagesManifest, evidencemeta] = await Promise.all([
		fetch('/api/customFormattingSettings.json/GET.json').then((x) => x.json()),
		fetch('/api/pagesManifest.json').then((x) => x.json()),
		fetch(`/api/${route.id}/evidencemeta.json`)
			.then((x) => x.json())
			.catch(() => ({ queries: [] }))
	]);

	const routeHash = md5(route.id);
	const paramsHash = md5(
		Object.entries(params)
			.sort()
			.map(([key, value]) => `${key}\x1F${value}`)
			.join('\x1E')
	);
	const isUserPage =
		route.id && system_routes.every((system_route) => !route.id.startsWith(system_route));

	/** @type {App.PageData["data"]} */
	let data = {};

	const {
		inputs = setTrackProxy({
			label: '',
			value: '(SELECT NULL WHERE 0 /* An Input has not been set */)'
		}) /* Create a proxy by default */
	} = dummy_pages.get(url.pathname) ?? {};

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
	if (browser && isUserPage && prerender) {
		data = await getPrerenderedQueries(routeHash, paramsHash, fetch);
	}

	/** @type {App.PageData["__db"]["query"]} */
	function query(sql, { query_name, callback = (x) => x } = {}) {
		if (browser) {
			return (async () => {
				await database_initialization;
				const result = await usqlQuery(sql);
				return callback(result);
			})();
		}

		return callback(
			usqlQuery(sql, {
				route_hash: routeHash,
				additional_hash: paramsHash,
				query_name,
				prerendering: building
			})
		);
	}

	let tree = pagesManifest;
	for (const part of (route.id ?? '').split('/').slice(1)) {
		tree = tree.children[part];
		if (!tree) break;
		if (tree.frontMatter?.title) {
			tree.title = tree.frontMatter.title;
		} else if (tree.frontMatter?.breadcrumb) {
			let { breadcrumb } = tree.frontMatter;
			for (const [param, value] of Object.entries(params)) {
				breadcrumb = breadcrumb.replaceAll(`\${params.${param}}`, value);
			}
			tree.title = (await query(breadcrumb))[0]?.breadcrumb;
		}
	}

	return /** @type {App.PageData} */ ({
		__db: {
			query,
			async load() {
				return database_initialization;
			},
			async updateParquetURLs(manifest) {
				// todo: maybe diff with old?
				const { renderedFiles } = JSON.parse(manifest);
				await profile(setParquetURLs, renderedFiles);
			}
		},
		inputs,
		data,
		customFormattingSettings,
		isUserPage,
		evidencemeta,
		pagesManifest
	});
};
