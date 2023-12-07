import { watch } from 'chokidar';
import EventEmitter from 'events';
import { updateDatasourceOutputs } from '../data-sources/index.js';
import { getSources } from '../data-sources/get-sources.js';
import { basename, dirname, resolve, sep as pathSep } from 'path';
import { readFile } from 'fs/promises';
import debounce from 'lodash.debounce';

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

/**
 * This is used to wrap the existing chokidar file watcher
 * It emits an additional `done` event that indicates source queries have finished execution
 */
const build_watcher = new EventEmitter();

if (process.env.NODE_ENV === 'development') {
	const watcher = watch('../../sources/**');
	watcher.on(
		'change',
		debounce(async (path) => {
			const { query, source_path } = getSourceAndQuery(path);
			const datasources = await getSources(resolve('../../sources'));
			const datasource = datasources.find((ds) => ds.sourceDirectory === source_path);
			if (!datasource) return;

			build_watcher.emit('change', path);

			const reservedFiles = ["connection.yaml", "connection.options.yaml"]
			const updatedFile = path.split(pathSep).pop()
			const rerunWholeSource = reservedFiles.includes(updatedFile)
			const queryFilter = rerunWholeSource ? null : new Set([query])

			// go in . (aka .evidence/template)
			try {
				const manifest = await updateDatasourceOutputs('./static/data', './.evidence-queries', {
					sources: new Set([datasource.name]),
					queries: queryFilter,
					only_changed: false
				});

				build_watcher.emit('done', path, JSON.stringify({ renderedFiles: manifest }), null);
			} catch (error) {
				console.error(`Error occured while reloading source: ${error}`);
				build_watcher.emit('done', path, {}, error);

			}
		}, 250)
	);
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
