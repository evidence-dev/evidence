// Azure AD service-principal credentials for a Fabric SQL endpoint (`server` is the host, no protocol/port).
export type FabricCredentials = {
	server: string;
	database: string;
	tenantId: string;
	clientId: string;
	clientSecret: string;
	/** TDS port; defaults to 1433. */
	port?: number;
	/** Schema for unqualified table names; defaults to 'dbo'. */
	defaultSchema?: string;
	/** Allowlist of schemas exposed to the schema browser; empty = all. */
	schemas?: string[];
};

// Assert the load-bearing keys so a corrupted secret fails readably, not deep in the driver.
export function normalizeCredentials(raw: unknown): FabricCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('Fabric credentials are missing or invalid');
	}
	const c = raw as Partial<FabricCredentials>;
	for (const key of ['server', 'database', 'tenantId', 'clientId', 'clientSecret'] as const) {
		if (!c[key] || typeof c[key] !== 'string') {
			throw new Error(`Fabric credentials are missing "${key}"`);
		}
	}
	return c as FabricCredentials;
}
