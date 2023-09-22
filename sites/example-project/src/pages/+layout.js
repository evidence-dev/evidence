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
		if (process.cwd().includes(".evidence")) {
			({ renderedFiles } = JSON.parse(
				await readFile('../../static/data/manifest.json', 'utf-8').catch(() => '{}')
			));	
		} else {
			({ renderedFiles } = JSON.parse(
				await readFile('./static/data/manifest.json', 'utf-8').catch(() => '{}')
			));	
		}
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
	data: { customFormattingSettings, routeHash, isUserPage, evidencemeta }
}) => {
	if (!browser) await database_initialization;

	const data = {};

	// let SSR saturate the cache first
	if (browser && isUserPage) {
		await Promise.all(
			evidencemeta.queries?.map(async ({ id }) => {
				const res = await fetch(`/api/${routeHash}/${id}.arrow`);
				if (res.ok) {
					const table = await tableFromIPC(res);
					data[id] = arrowTableToJSON(table);
				}
			}) ?? []
		);
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
