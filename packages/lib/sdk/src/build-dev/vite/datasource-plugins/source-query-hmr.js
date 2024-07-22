import path from 'path';
import { evalSources } from '../../../plugins/datasources/evalSources.js';
import { dataDirectory, metaDirectory, sourcesDirectory } from '../../../lib/projectPaths.js';
import { updateManifest } from '../../../plugins/datasources/updateManifest.js';
import { ProcessingQueue } from '../../../lib/processing-queue.js';
import { VITE_EVENTS } from '../constants.js';
import { debounce } from 'perfect-debounce';
/**
 * @returns {import("vite").Plugin}
 */
export const sourceQueryHmr = () => {
	const processingQueue = ProcessingQueue();

	/** @type {import('vite').ViteDevServer | undefined} */
	let server;

	/** @type {import('../../../plugins/datasources/types.js').Manifest | undefined} */
	let latestManifest;

	/**
	 * @param {string | null} datasource
	 * @param {string | null} table
	 */
	const processSource = (datasource, table) => async () => {
		if (!server) {
			console.warn('missing ref to dev server');
			return;
		}
		server.hot.send(VITE_EVENTS.SOURCE_START, {
			id: `${datasource}.${table}`,
			toast: {
				id: `${datasource}.${table}`,
				status: 'info',
				message: `Loading ${datasource}.${table}`
			}
		});

		try {
			const updatedManifest = await evalSources(
				dataDirectory,
				metaDirectory,
				{
					sources: datasource ? new Set([datasource]) : null,
					queries: table ? new Set([table]) : null,
					only_changed: false
				},
				true
			);
			latestManifest = await updateManifest(updatedManifest, dataDirectory);

			server?.hot.send(VITE_EVENTS.SOURCE_END, {
				id: `${datasource}.${table}-end`,
				toast: {
					id: `${datasource}.${table}`,
					status: 'success',
					message: `Finished ${datasource}.${table}`
				}
			});
		} catch (e) {
			server?.hot.send(VITE_EVENTS.SOURCE_ERROR, {
				error: e instanceof Error ? e.message : e,
				toast: {
					id: `${datasource}.${table}`,
					status: 'error',
					message: `Failed to process ${datasource}.${table}`
				}
			});
		}
	};

	const queueOptions = debounce(
		/**
		 * Whenever sources are saved, the connection.options.yaml file and the connection.yaml file are written
		 * Because we are using a file-watch, this would double up the executions, so we debounce them to prevent that
		 * @param {string} sourceName
		 */
		(sourceName) => {
			processingQueue.add(processSource(sourceName, null));
		},
		50
	);

	/** @type {import("vite").Plugin} */
	return {
		name: 'evidence:source-query-hmr',
		buildStart: function () {
			if (this.meta.watchMode) {
				this.addWatchFile(sourcesDirectory);
			}
		},
		configureServer: (s) => {
			server = s;
			processingQueue.addListener('done', () => {
				s.hot.send(VITE_EVENTS.RESET_QUERIES, { latestManifest });
			});
		},
		/** @type {import("vite").Plugin['watchChange']} */
		watchChange: async function (id) {
			const changed = path.resolve(id);
			if (!changed.startsWith(sourcesDirectory)) return; // don't care

			const parts = changed.replace(sourcesDirectory, '').split(path.sep);
			const sourceName = parts.at(1);
			const queryName = path.basename(changed).split('.').at(0);
			if (!sourceName || !queryName) {
				console.warn(
					`Failed to HMR source query at ${changed}, could not identify source or query name`
				);
				return;
			}
			// TODO: How can we debounce a little bit to make sure we don't run twice?
			if (queryName === 'connection' || queryName === 'connection.options')
				queueOptions(sourceName);
			else processingQueue.add(processSource(sourceName, queryName));
		}
	};
};
