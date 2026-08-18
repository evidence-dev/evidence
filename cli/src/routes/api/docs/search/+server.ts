import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchDocs } from '$lib/docs';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	if (!query) {
		return json({ error: 'Missing q parameter' }, { status: 400 });
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '10', 10);
	const results = searchDocs(query, limit);

	return json({ results });
};
