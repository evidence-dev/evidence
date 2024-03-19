import fs from 'fs/promises';
/** @type {import("vite").Plugin} */
export const queryDirectoryHmr = {
	name: 'evidence:query-directory-hmr',

	configureServer(server) {
		server.watcher.add('../../queries/**.sql');
		server.watcher.addListener(
			'change',
			/**
			 *
			 * @param {string} filename
			 * @returns {Promise<void>}
			 */
			async (filename) => {
				if (!(filename.includes('.evidence/template/queries') && filename.endsWith('.sql'))) return;
				const content = await fs.readFile(filename, 'utf-8');
				const queryId = filename
					.split('.evidence/template/queries/')
					.pop()
					?.split('.sql')[0]
					.replace('/', '_')
					.replace('\\', '_');

				server.ws.send('evidence:queryChange', {
					queryId,
					content
				});
			}
		);
	}
};
