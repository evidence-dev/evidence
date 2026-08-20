/**
 * Execution-layer Databricks credentials, resolved from connection.yaml (CLI) or
 * the Studio vault secret + org-settings config. Holds everything the driver
 * needs to connect: the endpoint (host + httpPath), the default catalog/schema,
 * and exactly one auth method (PAT token or OAuth M2M service principal).
 */
export type DatabricksAuthType = 'token' | 'oauth';

type DatabricksCredentialsBase = {
	host: string;
	httpPath: string;
	catalog: string;
	schema: string;
	/** Allowlist of schemas exposed to the schema browser; empty = just `schema`. */
	schemas?: string[];
};

export type DatabricksTokenCredentials = DatabricksCredentialsBase & {
	authType: 'token';
	token: string;
};

export type DatabricksOAuthCredentials = DatabricksCredentialsBase & {
	authType: 'oauth';
	clientId: string;
	clientSecret: string;
};

export type DatabricksCredentials = DatabricksTokenCredentials | DatabricksOAuthCredentials;

// Assert the load-bearing keys so a corrupted secret fails readably, not deep in
// the driver. Mirrors fabric/credentials.ts.
export function normalizeCredentials(raw: unknown): DatabricksCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('Databricks credentials are missing or invalid');
	}
	const c = raw as Partial<DatabricksCredentials> & Record<string, unknown>;
	for (const key of ['host', 'httpPath', 'catalog', 'schema'] as const) {
		if (!c[key] || typeof c[key] !== 'string') {
			throw new Error(`Databricks credentials are missing "${key}"`);
		}
	}
	if (c.authType === 'oauth') {
		if (typeof c.clientId !== 'string' || typeof c.clientSecret !== 'string') {
			throw new Error('Databricks OAuth credentials are missing "clientId" / "clientSecret"');
		}
	} else if (c.authType === 'token') {
		if (typeof c.token !== 'string') {
			throw new Error('Databricks credentials are missing "token"');
		}
	} else {
		throw new Error(`Databricks credentials have an unknown authType: ${String(c.authType)}`);
	}
	return c as DatabricksCredentials;
}
