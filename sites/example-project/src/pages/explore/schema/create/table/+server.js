import * as sdk from '@evidence-dev/sdk/plugins';
import { log } from '@evidence-dev/sdk/logger';
export const POST = async ({ request }) => {
	const data = await request.json();
	if (!('source' in data) || typeof data.source !== 'string') {
		return new Response('Missing source', { status: 400 });
	}

	if (!('table' in data) || typeof data.table !== 'string') {
		return new Response('Missing table name', { status: 400 });
	}

	const plugins = await sdk.loadSourcePlugins();
	const sources = await sdk.loadSources();
	const sourceSpec = sources.find((source) => source.name === data.source);
	const [, sourcePlugin] = plugins.bySource[sourceSpec.type];
	try {
		const newFilePath = await sourcePlugin.createSourceTable(data.table, sourceSpec.dir);
		return new Response(JSON.stringify({ createdFile: newFilePath }), { status: 200 });
	} catch (e) {
		log.warn(`Error while creating source table: `, e.message);
		return new Response('Failed to create source table', { status: 500 });
	}
};
