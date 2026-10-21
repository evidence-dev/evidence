/**
 * Server-side query runner: shared core of `/api/query`, callable directly
 * (e.g. by the validate command's metadata loader) without an HTTP round-trip.
 * Runs against connection.yaml if present, else the org's native warehouse via
 * Studio's /query/native, else the managed Evidence engine.
 */

// __DEFAULT_QUERY_ENGINE_HOST__ is replaced at build time by vite define;
// process.env overrides it at runtime (e.g. for dev/staging testing).
declare const __DEFAULT_QUERY_ENGINE_HOST__: string;
const PUBLIC_STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST ?? 'https://evidence.studio';
const PUBLIC_QUERY_ENGINE_HOST =
	process.env.PUBLIC_QUERY_ENGINE_HOST ?? __DEFAULT_QUERY_ENGINE_HOST__;
import {
	loadCredentials,
	ensureSessionResolved,
	clearSessionCache
} from '$lib/auth/credentials.server';
import { loadConnectionConfig, executeQuery as executeDirectQuery } from '$cli/connection';
import { schemaAllowlist } from '@evidence/core/connectors/schema-allowlist';
import { getProjectCwd } from '$lib/server/project-cwd';
import {
	queryNative,
	resolveOrgWarehouse,
	warehouseLabel,
	warehouseTypeForMode,
	type OrgWarehouse
} from '$cli/org-warehouse';
import type { ConnectionConfig } from '$cli/connection';
import type { Column } from '@evidence/core/user-components/interfaces/query-service';
import type { WarehouseType } from '@evidence/core/sql-dialect';

const STUDIO_HOST = PUBLIC_STUDIO_HOST.replace(/\/$/, '');

export interface RunQueryResult {
	rows: Record<string, unknown>[];
	columns: Column[];
	source?: string;
	error?: string;
	/** HTTP-style status hint for the `/api/query` wrapper. */
	status?: number;
}

async function storedLoginWarehouse(): Promise<OrgWarehouse | null> {
	const stored = await loadCredentials();
	const organizationId = stored?.organizationId;
	if (!stored || !organizationId) return null;
	let sealedSession: string | undefined;
	try {
		sealedSession = (await ensureSessionResolved(stored, STUDIO_HOST)).sealedSession;
	} catch {
		return null;
	}
	const authCookie = sealedSession ? `wos-session=${sealedSession}` : undefined;
	return resolveOrgWarehouse(STUDIO_HOST, organizationId, authCookie);
}

// Precedence: connection.yaml, then the logged-in org's native warehouse, then managed.
export async function resolveConnection(
	connectionConfig: ConnectionConfig | null | undefined
): Promise<{ connectionType: WarehouseType | null; schemaAllowlist: string[] }> {
	if (connectionConfig) {
		return {
			connectionType: connectionConfig.type,
			schemaAllowlist: schemaAllowlist(connectionConfig.type, connectionConfig)
		};
	}
	const org = await storedLoginWarehouse();
	if (!org) return { connectionType: null, schemaAllowlist: [] };
	return { connectionType: warehouseTypeForMode(org.mode), schemaAllowlist: org.schemaAllowlist };
}

export async function connectionYamlHint(): Promise<string | null> {
	try {
		const org = await storedLoginWarehouse();
		if (!org || org.mode === 'managed') return null;
		return `Your Evidence Studio account already has a ${warehouseLabel(org.mode)} connection. If you would prefer to use that connection, delete your connection.yaml.`;
	} catch {
		return null;
	}
}

export async function runQuery(sql: string): Promise<RunQueryResult> {
	// A broken connection.yaml should be reported, not masked by falling through.
	let connectionConfig;
	try {
		connectionConfig = await loadConnectionConfig(getProjectCwd());
	} catch (e) {
		return {
			rows: [],
			columns: [],
			error: e instanceof Error ? e.message : 'Failed to load connection.yaml',
			status: 500
		};
	}

	if (connectionConfig) {
		try {
			const result = await executeDirectQuery(sql, connectionConfig);
			const source =
				connectionConfig.type === 'snowflake'
					? 'Snowflake'
					: connectionConfig.type === 'bigquery'
						? 'BigQuery'
						: connectionConfig.type === 'fabric'
							? 'Microsoft Fabric'
							: undefined;
			return { rows: result.rows, columns: result.columns, source };
		} catch (e) {
			return {
				rows: [],
				columns: [],
				error: e instanceof Error ? e.message : 'Query execution failed',
				status: 500
			};
		}
	}

	// No connection.yaml — fall back to managed query engine.
	let credentials = await loadCredentials();

	if (!PUBLIC_QUERY_ENGINE_HOST) {
		return {
			rows: [],
			columns: [],
			error: 'PUBLIC_QUERY_ENGINE_HOST not configured. Set it in .env before building.',
			status: 500
		};
	}

	if (!credentials || !credentials.organizationId) {
		return {
			rows: [],
			columns: [],
			error:
				"Not authenticated. Run `evidence login` to use your Evidence Studio organization's connection, or add a connection.yaml to query your own database directly.",
			status: 401
		};
	}

	const organizationId = credentials.organizationId;
	const url = `${PUBLIC_QUERY_ENGINE_HOST}/v2/workspaces/${organizationId}/json`;

	try {
		credentials = await ensureSessionResolved(credentials, STUDIO_HOST);

		const authCookie = credentials.sealedSession
			? `wos-session=${credentials.sealedSession}`
			: undefined;
		const { mode } = await resolveOrgWarehouse(STUDIO_HOST, organizationId, authCookie);
		if (mode !== 'managed' && authCookie) {
			const outcome = await queryNative(STUDIO_HOST, authCookie, sql);
			if (outcome.ok) return { rows: outcome.rows, columns: outcome.columns };
			if (outcome.status === 401) clearSessionCache();
			return { rows: [], columns: [], error: outcome.error, status: outcome.status };
		}

		const encodedSql = Buffer.from(sql).toString('base64');

		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (credentials.sealedSession) {
			headers['Cookie'] = `wos-session=${credentials.sealedSession}`;
		} else {
			headers['Authorization'] = `Bearer ${credentials.accessToken}`;
		}

		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify({ query: encodedSql, queryWorkspaceData: true })
		});

		const responseText = await response.text();

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				clearSessionCache({ keepBackoff: !credentials.sealedSession });
				return {
					rows: [],
					columns: [],
					error: 'Session expired. Please log in again.',
					status: 401
				};
			}
			return {
				rows: [],
				columns: [],
				error: `Query engine error (${response.status}): ${responseText}`,
				status: response.status
			};
		}

		try {
			const parsed = JSON.parse(responseText);
			return {
				rows: parsed.rows ?? [],
				columns: parsed.columns ?? [],
				source: parsed.source
			};
		} catch {
			return { rows: [], columns: [], error: `Invalid response: ${responseText}`, status: 500 };
		}
	} catch (e) {
		return {
			rows: [],
			columns: [],
			error: e instanceof Error ? e.message : 'Unknown error',
			status: 500
		};
	}
}
