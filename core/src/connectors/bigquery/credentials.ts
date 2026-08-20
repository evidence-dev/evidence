export type BigQueryAuthType = 'service_account_json';

export type BigQueryServiceAccountJson = {
	client_email: string;
	private_key: string;
	project_id?: string;
	[key: string]: unknown;
};

type BigQueryConnectionParams = {
	projectId: string;
	location?: string;
	defaultDataset?: string;
};

export type BigQueryServiceAccountCredentials = BigQueryConnectionParams & {
	authType: 'service_account_json';
	serviceAccountJson: BigQueryServiceAccountJson;
};

export type BigQueryCredentials = BigQueryServiceAccountCredentials;

/**
 * Coerce raw vault payload into BigQueryCredentials.
 * The Vault stores arbitrary JSON; we trust the Studio config flow to write
 * the right shape but assert the load-bearing keys here so a corrupted secret
 * fails with a readable error rather than a downstream SDK error.
 */
export function normalizeCredentials(raw: unknown): BigQueryCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('BigQuery credentials are missing or invalid');
	}
	const creds = raw as Partial<BigQueryCredentials> & { serviceAccountJson?: unknown };
	if (typeof creds.projectId !== 'string' || creds.projectId.length === 0) {
		throw new Error('BigQuery credentials are missing projectId');
	}
	const sa = creds.serviceAccountJson;
	if (!sa || typeof sa !== 'object') {
		throw new Error('BigQuery credentials are missing serviceAccountJson');
	}
	const saObj = sa as Partial<BigQueryServiceAccountJson>;
	if (typeof saObj.client_email !== 'string' || saObj.client_email.length === 0) {
		throw new Error('BigQuery serviceAccountJson is missing client_email');
	}
	if (typeof saObj.private_key !== 'string' || saObj.private_key.length === 0) {
		throw new Error('BigQuery serviceAccountJson is missing private_key');
	}
	return {
		authType: 'service_account_json',
		projectId: creds.projectId,
		serviceAccountJson: sa as BigQueryServiceAccountJson,
		location: typeof creds.location === 'string' ? creds.location : undefined,
		defaultDataset:
			typeof creds.defaultDataset === 'string' ? creds.defaultDataset : undefined
	};
}
