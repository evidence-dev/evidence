/**
 * Query proxy endpoint.
 *
 * Validate the HTTP boundary before forwarding arbitrary SQL to the direct
 * connector or managed Evidence query engine.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runQuery } from '$lib/server/run-query';
import { parseSqlQueryRequest } from '$lib/server/query-request-guard';

export const POST: RequestHandler = async ({ request }) => {
	const parsed = await parseSqlQueryRequest(request);
	if (parsed instanceof Response) return parsed;

	const result = await runQuery(parsed);
	if (result.error) {
		return json({ error: result.error }, { status: result.status ?? 500 });
	}

	return json({ rows: result.rows, columns: result.columns, source: result.source });
};
