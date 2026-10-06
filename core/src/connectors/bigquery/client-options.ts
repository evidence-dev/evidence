import type { BigQueryCredentials } from './credentials';

/**
 * Subset of @google-cloud/bigquery's BigQueryOptions we set. Defined locally
 * to avoid a runtime/type dep on the SDK at the @evidence/core level — both
 * cli/ and studio/ import the SDK themselves and pass these options through to
 * `new BigQuery(...)`.
 */
export type BigQueryClientOptions = {
	projectId: string;
	/** Omitted for ADC; the SDK then resolves Application Default Credentials. */
	credentials?: { client_email: string; private_key: string };
	location?: string;
};

/** Build the options object passed to `new BigQuery(...)`. */
export function buildBigQueryClientOptions(
	credentials: BigQueryCredentials
): BigQueryClientOptions {
	const opts: BigQueryClientOptions = { projectId: credentials.projectId };
	if (credentials.authType === 'service_account_json') {
		const { client_email, private_key } = credentials.serviceAccountJson;
		opts.credentials = { client_email, private_key };
	}
	if (credentials.location !== undefined) {
		opts.location = credentials.location;
	}
	return opts;
}
