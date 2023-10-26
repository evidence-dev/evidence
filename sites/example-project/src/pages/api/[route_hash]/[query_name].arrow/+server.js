import { get_cache_for_hash } from '@evidence-dev/universal-sql';
import { error } from '@sveltejs/kit';

export const GET = ({ params }) => {
	try {
		return new Response(get_cache_for_hash(params.route_hash, params.query_name));
	} catch (e) {
		throw error(404, 'not found');
	}
};
