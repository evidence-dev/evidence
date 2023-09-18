import { watch } from 'chokidar';
import EventEmitter from 'events';
import { updateDatasourceOutputs } from '@evidence-dev/plugin-connector';
import { basename, dirname } from 'path';
import { readFile } from 'fs/promises';

function getSourceAndQuery(path) {
	const query = basename(path).split('.')[0];
	while (basename(dirname(path)) !== 'sources') {
		path = dirname(path);
	}
	const source = basename(path);
	return { source, query };
}

const build_watcher = new EventEmitter();

const watcher = watch('../../sources/**');
watcher.on('change', async (path) => {
	const { source, query } = getSourceAndQuery(path);

	// go in ../.. (root) vs. . (aka .evidence/template)
	await updateDatasourceOutputs(`../../static/data`, '/data', {
		sources: new Set([source]),
		queries: new Set([query])
	});

	// get new manifest
	const manifest = await readFile('../../static/data/manifest.json', 'utf-8');

	build_watcher.emit('done', path, manifest);
});

export const GET = () => {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			const handler = (path, manifest, status) => {
				const { source, query } = getSourceAndQuery(path);
				try {
					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify({
								id: `${source}.${query}`,
								status,
								manifest
							})}\n\n`
						)
					);
				} catch (e) {
					if (e.code === 'ERR_INVALID_STATE') {
						// controller complains about this
						// probably doesn't play well with vite HMR
						return;
					}
					console.error(e);
				}
			};

			const change_handler = (path) => handler(path, {}, 'running');
			const done_handler = (path, manifest) => handler(path, manifest, 'done');

			watcher.on('change', change_handler);
			build_watcher.on('done', done_handler);
			// todo: check if 60 second timeout is enough
			await new Promise((resolve) => setTimeout(resolve, 60000));
			watcher.off('change', change_handler);
			build_watcher.off('done', done_handler);

			controller.close();
		}
	});

	return new Response(stream, {
		headers: {
			'Cache-Control': 'no-store',
			'Content-Type': 'text/event-stream',
			Connection: 'keep-alive'
		}
	});
};
