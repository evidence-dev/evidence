/**
 * Direct Coupler.io query execution over the Coupler.io Public API, using the
 * credentials from connection.yaml. The client, scheduler and query runner live
 * in @evidence/core/connectors/coupler-io; this keeps one client per config so
 * its rate-limit state and caches outlive a single query.
 */

import { CouplerIoClient } from '@evidence/core/connectors/coupler-io/client';
import { runCouplerIoQuery } from '@evidence/core/connectors/coupler-io/run-query';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { CouplerIoCredentials } from '@evidence/core/connectors/coupler-io/credentials';
import type { QueryResult } from './types';

let cachedClient: { key: string; client: CouplerIoClient } | null = null;

function getClient(config: CouplerIoCredentials): CouplerIoClient {
	// JSON.stringify (not join) so a value containing a delimiter can't collide.
	const key = JSON.stringify([
		config.apiHost,
		config.workspaceId,
		config.token,
		config.tables,
		config.maxConcurrentRequests
	]);
	if (cachedClient?.key === key) return cachedClient.client;
	cachedClient = { key, client: new CouplerIoClient(config) };
	return cachedClient.client;
}

export async function executeCouplerIoQuery(
	sql: string,
	config: CouplerIoCredentials
): Promise<QueryResult> {
	const { rows, columns } = await runCouplerIoQuery(getClient(config), sql);
	normalizeSparklineRows(rows, columns);
	return { rows, columns };
}
