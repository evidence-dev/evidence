/**
 * Execution-layer SQL Server credentials, resolved from connection.yaml (CLI) or
 * the Studio vault secret + org-settings config, with any file-referenced CA
 * already read into memory (see resolve.ts).
 */
export type SqlServerCredentials = {
	server: string;
	port: number;
	user: string;
	password: string;
	database: string;
	encrypt: boolean;
	trustServerCertificate: boolean;
	/** PEM CA bundle used to verify the server certificate. */
	ca?: string;
	/** Schema for unqualified table names. */
	schema: string;
	/** Allowlist of schemas exposed to the schema browser; empty = all. */
	schemas?: string[];
};

// Assert the load-bearing keys so a corrupted secret fails readably, not deep in the driver.
export function normalizeCredentials(raw: unknown): SqlServerCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('SQL Server credentials are missing or invalid');
	}
	const c = raw as Partial<SqlServerCredentials> & Record<string, unknown>;
	for (const key of ['server', 'user', 'password', 'database'] as const) {
		if (!c[key] || typeof c[key] !== 'string') {
			throw new Error(`SQL Server credentials are missing "${key}"`);
		}
	}
	return {
		...(c as SqlServerCredentials),
		port: typeof c.port === 'number' ? c.port : 1433,
		encrypt: c.encrypt !== false,
		trustServerCertificate: c.trustServerCertificate === true,
		schema: typeof c.schema === 'string' && c.schema ? c.schema : 'dbo'
	};
}
