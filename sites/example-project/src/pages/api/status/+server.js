import { watch } from 'chokidar';
import EventEmitter from 'events';
import { updateDatasourceOutputs, getSources } from '@evidence-dev/plugin-connector';
import { basename, dirname, resolve } from 'path';
import { readFile } from 'fs/promises';

function getSourceAndQuery(path) {
	const query = basename(path).split('.')[0];
	while (basename(dirname(path)) !== 'sources') {
		path = dirname(path);
	}
	const source = basename(path);
	return { source, query, source_path: resolve(path) };
}

const build_watcher = new EventEmitter();

const watcher = watch('../../sources/**');
watcher.on('change', async (path) => {
	build_watcher.emit('change', path);

	const { query, source_path } = getSourceAndQuery(path);
	const datasources = await getSources(resolve('../../sources'));
	const datasource = datasources.find((ds) => ds.sourceDirectory === source_path);

	// go in ../.. (root) vs. . (aka .evidence/template)
	const error = await updateDatasourceOutputs(`../../static/data`, '/data', {
		sources: new Set([datasource?.name]),
		queries: datasource ? null : new Set([query])
	}).catch((e) => e);

	if (error) {
		console.error(`Error occured while reloading source: ${error}`)
		build_watcher.emit('done', path, {}, error);
	} else {
		// get new manifest
		const manifest = await readFile('../../static/data/manifest.json', 'utf-8');

		build_watcher.emit('done', path, manifest, null);
	}
});

function createHandlers(controller) {
	const encoder = new TextEncoder();

	const handler = (path, manifest, error, status) => {
		const { source, query } = getSourceAndQuery(path);
		try {
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({
						id: `${source}.${query}`,
						status: error ? 'error' : status,
						manifest
					})}\n\n`
				)
			);
		} catch (e) {
			console.error(`Error occured while reloading source: ${e}`);
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({
						id: `${source}.${query}`,
						status: 'error',
						manifest: {}
					})}\n\n`
				)
			);
		}
	};

	const change_handler = (path) => handler(path, {}, null, 'running');
	const done_handler = (path, manifest, error) => handler(path, manifest, error, 'done');

	return { change_handler, done_handler };
}

export const GET = () => {
	let change_handler, done_handler;
	const stream = new ReadableStream({
		async start(controller) {
			({ change_handler, done_handler } = createHandlers(controller));

			build_watcher.on('change', change_handler);
			build_watcher.on('done', done_handler);
			// todo: check if 60 second timeout is enough
			await new Promise((resolve) => setTimeout(resolve, 60000));
			build_watcher.off('change', change_handler);
			build_watcher.off('done', done_handler);

			controller.close();
		},
		cancel() {
			build_watcher.off('change', change_handler);
			build_watcher.off('done', done_handler);
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
