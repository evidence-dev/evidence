import { runQueries } from '@evidence-dev/db-orchestrator';
import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';

export const prerender = true;

export async function GET({ params }) {
	const { route } = params;
	const data = await runQueries(route, dev);
	return json({ data });
}
