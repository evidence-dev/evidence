import runQueries from '@evidence-dev/db-orchestrator';
import database from '/.evidence/database.config.json';
import config from '/evidence.config.json';
import { dev } from '$app/env';

export async function get({ params }) {
	const { route } = params;
	const data = await runQueries(route, database, config, dev);
	return {
		body: {
			data
		}
	};
}
