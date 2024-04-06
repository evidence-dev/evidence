import { error } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	try {
		return new Response(
			await EvidenceCache.getAllPageQueries(params.route_hash, params.additional_hash)
		);
	} catch (e) {
		throw error(404, 'not found');
	}
};
