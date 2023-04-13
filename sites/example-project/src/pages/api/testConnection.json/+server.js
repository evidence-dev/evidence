export const prerender = false;

import { testConnection } from '@evidence-dev/db-orchestrator';
import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';

export async function POST() {
	let result = await testConnection(dev);
	let status = result === 'Database Connected' ? 200 : 500;
	return json(result, { status });
}
