import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { componentList } from '$lib/docs';

export const GET: RequestHandler = async () => {
	const byCategory: Record<string, string[]> = {};

	for (const { name, category } of componentList) {
		if (!byCategory[category]) {
			byCategory[category] = [];
		}
		byCategory[category].push(name);
	}

	return json({ components: byCategory });
};
