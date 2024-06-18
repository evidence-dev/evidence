import path from 'path';
import { evalSources } from '../../../plugins/datasources/evalSources.js';
import { dataDirectory, metaDirectory, sourcesDirectory } from '../virtuals/node/projectPaths.js';
import { updateManifest } from '../../../plugins/datasources/updateManifest.js';
import { ProcessingQueue } from '../../../lib/processing-queue.js';
import { VITE_EVENTS } from '../constants.js';
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
	 * @param {string} datasource
	 * @param {string} table
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
					sources: new Set([datasource]),
					queries: new Set([table]),
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
			if (!id.startsWith(sourcesDirectory)) return; // don't care
			const parts = id.replace(sourcesDirectory, '').split('/');
			const sourceName = parts.at(1);
			const queryName = path.basename(id).split('.').at(0);
			if (!sourceName || !queryName) {
				console.warn(
					`Failed to HMR source query at ${id}, could not identify source or query name`
				);
				return;
			}
			processingQueue.add(processSource(sourceName, queryName));
		}
	};
};
