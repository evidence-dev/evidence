// Static keys are optional: without them the CLI uses `profile` or the AWS default chain.
export type AthenaCredentials = {
	region: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	sessionToken?: string;
	profile?: string;
	/** Default role assumed when the caller doesn't resolve a more specific one. */
	roleArn?: string;
	externalId?: string;
	workGroup: string;
	outputLocation?: string;
	catalog: string;
	schema: string;
	/** Allowlist of Glue databases exposed to the schema browser; empty = just `schema`. */
	schemas?: string[];
	resultReuseMinutes: number;
};

// Fail readably on a corrupted secret rather than deep in the SDK.
export function normalizeCredentials(raw: unknown): AthenaCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('Athena credentials are missing or invalid');
	}
	const c = raw as Partial<AthenaCredentials> & Record<string, unknown>;
	for (const key of ['region', 'workGroup', 'catalog', 'schema'] as const) {
		if (!c[key] || typeof c[key] !== 'string') {
			throw new Error(`Athena credentials are missing "${key}"`);
		}
	}
	if (Boolean(c.accessKeyId) !== Boolean(c.secretAccessKey)) {
		throw new Error('Athena credentials need both "accessKeyId" and "secretAccessKey"');
	}
	return {
		...(c as AthenaCredentials),
		resultReuseMinutes: typeof c.resultReuseMinutes === 'number' ? c.resultReuseMinutes : 60
	};
}
