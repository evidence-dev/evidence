import { getStatusAndExtractQueries } from './extractQueries.server.js';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
	const { route } = params;
	const status = getStatusAndExtractQueries('/' + route);
	if (status) {
		return json({ status });
	}
}
