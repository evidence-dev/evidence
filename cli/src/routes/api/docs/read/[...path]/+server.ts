import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readDoc, searchIndex } from '$lib/docs';

export const GET: RequestHandler = async ({ params }) => {
	const doc = readDoc(params.path);

	if (!doc) {
		return json(
			{ error: 'not_found', available: searchIndex.map((d) => d.path).sort() },
			{ status: 404 }
		);
	}

	return json({
		path: doc.path,
		title: doc.title,
		category: doc.category,
		content: doc.content
	});
};
