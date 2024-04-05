import { error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	try {
		return new Response(await EvidenceCache.getDataForQueryHash(params.query_hash));
	} catch (e) {
		throw error(404, 'not found');
	}
};
