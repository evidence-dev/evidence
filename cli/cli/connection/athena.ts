/**
 * Direct Athena query execution using the credentials from connection.yaml.
 *
 * Credentials come from static keys, a named profile, or the AWS default chain
 * (env vars, SSO, instance role), optionally assuming `role_arn`. No per-user
 * roles here: the CLI has no per-user identity.
 */

import {
	AthenaClient,
	GetQueryExecutionCommand,
	GetQueryResultsCommand,
	StartQueryExecutionCommand,
	StopQueryExecutionCommand,
	type AthenaClientConfig
} from '@aws-sdk/client-athena';
import { fromIni, fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import { mapAthenaColumns } from '@evidence/core/connectors/athena/map-columns';
import { athenaRowsToObjects } from '@evidence/core/connectors/athena/normalize-rows';
import { athenaStartInput, runAthenaQuery } from '@evidence/core/connectors/athena/run-query';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { AthenaCredentials } from '@evidence/core/connectors/athena/credentials';
import type { QueryResult } from './types';

const TIMEOUT_MS = 10 * 60_000;

let cachedClient: { key: string; client: AthenaClient } | null = null;

function configKey(c: AthenaCredentials): string {
	return [
		c.region,
		c.accessKeyId,
		c.secretAccessKey,
		c.sessionToken,
		c.profile,
		c.roleArn,
		c.externalId
	].join('|');
}

function credentialsFor(c: AthenaCredentials): AthenaClientConfig['credentials'] {
	const base =
		c.accessKeyId && c.secretAccessKey
			? {
					accessKeyId: c.accessKeyId,
					secretAccessKey: c.secretAccessKey,
					...(c.sessionToken ? { sessionToken: c.sessionToken } : {})
				}
			: c.profile
				? fromIni({ profile: c.profile })
				: // undefined → the SDK's default credential chain.
					undefined;
	if (!c.roleArn) return base;
	return fromTemporaryCredentials({
		...(base ? { masterCredentials: base } : {}),
		params: {
			RoleArn: c.roleArn,
			RoleSessionName: 'evidence-cli',
			...(c.externalId ? { ExternalId: c.externalId } : {})
		},
		clientConfig: { region: c.region }
	});
}

function getClient(config: AthenaCredentials): AthenaClient {
	const key = configKey(config);
	if (cachedClient?.key === key) return cachedClient.client;
	cachedClient?.client.destroy();
	const client = new AthenaClient({ region: config.region, credentials: credentialsFor(config) });
	cachedClient = { key, client };
	return client;
}

export async function executeAthenaQuery(
	sql: string,
	config: AthenaCredentials
): Promise<QueryResult> {
	const client = getClient(config);
	const { columnInfo, rows: rawRows } = await runAthenaQuery(
		{
			start: (input) => client.send(new StartQueryExecutionCommand(input)),
			getExecution: (id) => client.send(new GetQueryExecutionCommand({ QueryExecutionId: id })),
			getResults: (id, nextToken) =>
				client.send(
					new GetQueryResultsCommand({
						QueryExecutionId: id,
						NextToken: nextToken,
						MaxResults: 1000
					})
				),
			stop: (id) => client.send(new StopQueryExecutionCommand({ QueryExecutionId: id }))
		},
		athenaStartInput(config, sql),
		{ timeoutMs: TIMEOUT_MS }
	);

	const columns = mapAthenaColumns(columnInfo);
	const rows = athenaRowsToObjects(rawRows, columns);
	normalizeSparklineRows(rows, columns);
	return { rows, columns };
}
