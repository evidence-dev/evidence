import {
	COUPLER_IO_DEFAULT_API_HOST,
	COUPLER_IO_DEFAULT_MAX_CONCURRENT_REQUESTS,
	COUPLER_IO_ORIGIN_RE
} from './connection-schema';

/**
 * Execution-layer Coupler.io credentials, resolved from connection.yaml.
 *
 * `tables` maps a table name to a dataset id; empty means auto-discover every
 * queryable dataset in the workspace.
 */
export type CouplerIoCredentials = {
	token: string;
	workspaceId: string;
	apiHost: string;
	tables: Record<string, string>;
	/** Requests in flight at once; the rest queue. */
	maxConcurrentRequests: number;
};

// Assert the load-bearing keys so a corrupted secret fails readably rather than
// at the first API call. The token is sent to apiHost, so it has to be a
// Coupler.io origin here too, not only in connection.yaml.
export function normalizeCredentials(raw: unknown): CouplerIoCredentials {
	if (raw === null || raw === undefined || typeof raw !== 'object') {
		throw new Error('Coupler.io credentials are missing or invalid');
	}
	const c = raw as Partial<CouplerIoCredentials> & Record<string, unknown>;
	for (const key of ['token', 'workspaceId'] as const) {
		if (!c[key] || typeof c[key] !== 'string') {
			throw new Error(`Coupler.io credentials are missing "${key}"`);
		}
	}
	const apiHost = c.apiHost ?? COUPLER_IO_DEFAULT_API_HOST;
	if (typeof apiHost !== 'string' || !COUPLER_IO_ORIGIN_RE.test(apiHost)) {
		throw new Error('Coupler.io credentials have an "apiHost" outside coupler.io');
	}
	return {
		token: c.token!,
		workspaceId: c.workspaceId!,
		apiHost,
		tables: c.tables && typeof c.tables === 'object' ? c.tables : {},
		maxConcurrentRequests:
			typeof c.maxConcurrentRequests === 'number'
				? c.maxConcurrentRequests
				: COUPLER_IO_DEFAULT_MAX_CONCURRENT_REQUESTS
	};
}
