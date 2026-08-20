import type { BigQueryCredentials } from './credentials';

/**
 * Subset of @google-cloud/bigquery's BigQueryOptions we set. Defined locally
 * to avoid a runtime/type dep on the SDK at the @evidence/core level — both
 * cli/ and studio/ import the SDK themselves and pass these options through to
 * `new BigQuery(...)`.
 */
export type BigQueryClientOptions = {
	projectId: string;
	credentials: { client_email: string; private_key: string };
	location?: string;
};

/**
 * Build the options object passed to `new BigQuery(...)`. Service-account JSON
 * is the only auth path supported in v1.
 */
export function buildBigQueryClientOptions(
	credentials: BigQueryCredentials
): BigQueryClientOptions {
	const { client_email, private_key } = credentials.serviceAccountJson;
	const opts: BigQueryClientOptions = {
		projectId: credentials.projectId,
		credentials: { client_email, private_key }
	};
	if (credentials.location !== undefined) {
		opts.location = credentials.location;
	}
	return opts;
}
