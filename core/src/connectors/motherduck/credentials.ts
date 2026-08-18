/**
 * Execution-layer MotherDuck credentials, resolved from connection.yaml (CLI) or
 * the Studio vault secret + org-settings config. MotherDuck is queried over its
 * Postgres-wire endpoint, so these are everything the `pg` driver needs.
 *
 * `token` is the MotherDuck service token (sent as the Postgres password).
 * `database` is the MotherDuck database name. `host` is the region-specific
 * Postgres endpoint. `schemas` is the optional schema-browser allowlist.
 */
export type MotherduckCredentials = {
	token: string;
	database: string;
	host: string;
	/** Allowlist of schemas exposed to the schema browser; empty = all non-system. */
	schemas?: string[];
};

// Assert the load-bearing keys so a corrupted secret fails readably, not deep in
// the driver. Mirrors postgres/credentials.ts.
export function normalizeCredentials(raw: unknown): MotherduckCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('MotherDuck credentials are missing or invalid');
	}
	const c = raw as Partial<MotherduckCredentials> & Record<string, unknown>;
	for (const key of ['token', 'database', 'host'] as const) {
		if (!c[key] || typeof c[key] !== 'string') {
			throw new Error(`MotherDuck credentials are missing "${key}"`);
		}
	}
	return c as MotherduckCredentials;
}
