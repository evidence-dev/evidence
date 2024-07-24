import { get_all_page_queries } from '@evidence-dev/universal-sql';
import { error } from '@sveltejs/kit';

export const GET = ({ params }) => {
	try {
		return new Response(get_all_page_queries(params.route_hash, params.additional_hash));
	} catch (e) {
		throw error(404, 'not found');
	}
};
