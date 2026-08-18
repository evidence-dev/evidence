/**
 * Query proxy endpoint.
 *
 * Thin HTTP wrapper around `runQuery` (see `$lib/server/run-query`), which holds
 * the shared logic: run against connection.yaml if present, else proxy to the
 * managed Evidence query engine.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runQuery } from '$lib/server/run-query';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sql } = body;

	if (!sql || typeof sql !== 'string') {
		throw error(400, 'Missing sql parameter');
	}

	const result = await runQuery(sql);

	if (result.error) {
		return json({ error: result.error }, { status: result.status ?? 500 });
	}

	return json({ rows: result.rows, columns: result.columns, source: result.source });
};
