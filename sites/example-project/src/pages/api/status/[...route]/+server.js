import { getStatusAndExtractQueries } from './extractQueries.server.js';
import { json } from '@sveltejs/kit';

export async function GET(event) {
	const status = getStatusAndExtractQueries(event);
	if (status) {
		return json({ status });
	}
}
