import { watch } from 'chokidar';
import EventEmitter from 'events';
import { updateDatasourceOutputs } from '../data-sources/index.js';
import { getSources } from '../data-sources/get-sources.js';
import { basename, dirname, resolve } from 'path';
import { readFile, rm } from 'fs/promises';

/**
 * Extracts source, query, and source_path from a path
 * @param {string} path
 * @returns {{ source: string, query: string, source_path: string }}
 */
function getSourceAndQuery(path) {
	const query = basename(path).split('.')[0];
	while (basename(dirname(path)) !== 'sources') {
		path = dirname(path);
	}
	const source = basename(path);
	return { source, query, source_path: resolve(path) };
}

const build_watcher = new EventEmitter();

if (process.env.NODE_ENV === 'development') {
	const watcher = watch('../../sources/**');
	watcher.on('change', async (path) => {
		const { query, source_path } = getSourceAndQuery(path);
		const datasources = await getSources(resolve('../../sources'));
		const datasource = datasources.find((ds) => ds.sourceDirectory === source_path);
		if (!datasource) return;

		build_watcher.emit('change', path);

		// go in . (aka .evidence/template)
		const error = await updateDatasourceOutputs('.', '/data', {
			sources: new Set([datasource.name]),
			queries: source_path.endsWith('connection.yaml') ? null : new Set([query]),
			only_changed: false
		}).catch((e) => e);

		if (error) {
			console.error(`Error occured while reloading source: ${error}`);
			build_watcher.emit('done', path, {}, error);
		} else {
			const manifest = await readFile('./static/data/manifest.json', 'utf-8');
			build_watcher.emit('done', path, manifest, null);
		}
	});
}

/** @typedef {(path: string, manifest: object, error: Error | null, status: string) => void} Handler */

const subscribed_servers = new Map();

/** @type {import("vite").Plugin["configureServer"]} */
const configureServer = (server) => {
	// handle server restarts
	if (subscribed_servers.has(server)) return;
	subscribed_servers.forEach((handlers) => {
		build_watcher.off('change', handlers.change_handler);
		build_watcher.off('done', handlers.done_handler);
	});
	subscribed_servers.clear();

	/** @type {Handler} */
	const handler = (path, manifest, error, status) => {
		const { source, query } = getSourceAndQuery(path);

		server.ws.send('evidence:build-status', {
			id: `${source}.${query}`,
			status: error ? 'error' : status,
			manifest
		});
	};

	/** @type {Handler} */
	const change_handler = (path) => handler(path, {}, null, 'running');
	/** @type {Handler} */
	const done_handler = (path, manifest, error) => handler(path, manifest, error, 'done');

	build_watcher.on('change', change_handler);
	build_watcher.on('done', done_handler);

	subscribed_servers.set(server, { change_handler, done_handler });
};

/** @type {() => import("vite").Plugin} */
export const sourceQueryHMR = () => {
	return {
		name: 'Evidence Vite Plugin for Source Query HMR',
		configureServer
	};
};
