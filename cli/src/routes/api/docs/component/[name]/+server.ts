import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getComponentDetail, listAllComponentNames } from '$lib/docs';

export const GET: RequestHandler = async ({ params }) => {
	const detail = getComponentDetail(params.name);

	if (!detail) {
		return json({ error: 'not_found', available: listAllComponentNames() }, { status: 404 });
	}

	return json(detail);
};
