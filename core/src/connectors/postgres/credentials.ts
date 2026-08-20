/**
 * Execution-layer Postgres credentials, resolved from connection.yaml (CLI) or
 * the Studio vault secret + org-settings config. Holds everything node-postgres
 * needs to connect, with any file-referenced TLS material already read into
 * memory (see resolve.ts).
 *
 * This is the shared shape for every Postgres-wire flavour — generic Postgres,
 * Amazon RDS / Aurora, Supabase, Neon, Timescale, and so on. They differ only in
 * form defaults (host, port, sslMode) and metadata, not in the credential shape.
 */
export type PostgresSslMode = 'disable' | 'require' | 'verify-ca' | 'verify-full';

export type PostgresSslConfig = {
	mode: PostgresSslMode;
	/** PEM CA bundle used to verify the server cert (verify-ca / verify-full). */
	ca?: string;
	/** PEM client certificate for mutual TLS. */
	cert?: string;
	/** PEM client private key for mutual TLS. */
	key?: string;
};

export type PostgresCredentials = {
	host: string;
	port: number;
	user: string;
	password: string;
	database: string;
	/** Schema for unqualified table references (sets search_path). */
	schema: string;
	/** Allowlist of schemas exposed to the schema browser; empty = just `schema`. */
	schemas?: string[];
	ssl: PostgresSslConfig;
};

const SSL_MODES: readonly PostgresSslMode[] = ['disable', 'require', 'verify-ca', 'verify-full'];

// Assert the load-bearing keys so a corrupted secret fails readably, not deep in
// the driver. Mirrors databricks/credentials.ts.
export function normalizeCredentials(raw: unknown): PostgresCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('Postgres credentials are missing or invalid');
	}
	const c = raw as Partial<PostgresCredentials> & Record<string, unknown>;
	for (const key of ['host', 'user', 'password', 'database', 'schema'] as const) {
		if (!c[key] || typeof c[key] !== 'string') {
			throw new Error(`Postgres credentials are missing "${key}"`);
		}
	}
	if (typeof c.port !== 'number' || !Number.isInteger(c.port)) {
		throw new Error('Postgres credentials are missing a numeric "port"');
	}
	const ssl = c.ssl as Partial<PostgresSslConfig> | undefined;
	if (!ssl || typeof ssl !== 'object' || !SSL_MODES.includes(ssl.mode as PostgresSslMode)) {
		throw new Error('Postgres credentials have an invalid "ssl.mode"');
	}
	return c as PostgresCredentials;
}
