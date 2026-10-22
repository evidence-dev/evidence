/**
 * Which warehouse a Studio org serves from, and how to query it when it's native.
 *
 * Orgs with a native warehouse (Snowflake, BigQuery, …) don't have their data in the
 * managed engine, so without a local connection.yaml the CLI must go through Studio's
 * /query/native — the same path the web app uses.
 */

import { warn } from './log.ts';
import { WAREHOUSE_MODES, type WarehouseMode } from '@evidence/core/connectors/warehouse-mode';
import type { WarehouseType } from '@evidence/core/sql-dialect';
import type { Column } from '@evidence/core/user-components/interfaces/query-service';

export interface OrgWarehouse {
	mode: WarehouseMode;
	schemaAllowlist: string[];
}

const MANAGED: OrgWarehouse = { mode: 'managed', schemaAllowlist: [] };
// Bounded so a warehouse switched in Studio is picked up by a running `evidence dev`.
const CACHE_TTL_MS = 5 * 60 * 1000;
// Failures are cached too, briefly, so an offline or old Studio isn't re-asked on every query.
const FAILURE_TTL_MS = 60 * 1000;
// Short: page loads and validate wait on this before falling back to managed.
const LOOKUP_TIMEOUT_MS = 5000;

const cache = new Map<string, { value: OrgWarehouse; expiresAt: number }>();

export function clearOrgWarehouseCache(): void {
	cache.clear();
}

/** evidence.studio ↔ www.evidence.studio: the only redirect our session cookie may follow. */
export function isSameSiteRedirect(from: string, to: string): boolean {
	const a = new URL(from);
	const b = new URL(to);
	if (b.protocol !== a.protocol) return false;
	const bare = (host: string) => (host.startsWith('www.') ? host.slice(4) : host);
	return bare(a.host) === bare(b.host);
}

// Follow Vercel's apex→www redirect by hand so the cookie only ever goes to Studio.
async function fetchStudio(url: string, init: RequestInit): Promise<Response> {
	let current = url;
	for (let hop = 0; hop < 3; hop++) {
		const response = await fetch(current, { ...init, redirect: 'manual' });
		const location = response.headers.get('location');
		if (response.status < 300 || response.status >= 400 || !location) return response;
		const next = new URL(location, current).toString();
		if (
			!isSameSiteRedirect(current, next) ||
			new URL(next).pathname !== new URL(current).pathname
		) {
			return response;
		}
		current = next;
	}
	return fetch(current, { ...init, redirect: 'manual' });
}

// Fails open to managed so an unreachable Studio never blocks local dev.
export async function resolveOrgWarehouse(
	studioHost: string,
	organizationId: string,
	authCookie: string | undefined
): Promise<OrgWarehouse> {
	const cached = cache.get(organizationId);
	if (cached && Date.now() < cached.expiresAt) return cached.value;
	if (!authCookie) return MANAGED;

	const remember = (value: OrgWarehouse, ttlMs: number) => {
		cache.set(organizationId, { value, expiresAt: Date.now() + ttlMs });
		return value;
	};
	// Never silent: a failed lookup sends queries to the Evidence Warehouse instead.
	const fellBack = (reason: string) => {
		warn(
			`  Warning: couldn't look up your organization's warehouse (${reason}); using the Evidence Warehouse.`
		);
		return remember(MANAGED, FAILURE_TTL_MS);
	};
	try {
		const response = await fetchStudio(`${studioHost}/query/warehouse`, {
			headers: { Cookie: authCookie },
			signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS)
		});
		if (!response.ok) return fellBack(`HTTP ${response.status}`);
		return remember(parseOrgWarehouse(await response.json()), CACHE_TTL_MS);
	} catch (err) {
		return fellBack(err instanceof Error ? err.message : String(err));
	}
}

export function parseOrgWarehouse(body: unknown): OrgWarehouse {
	const b = (body ?? {}) as { warehouseMode?: unknown; schemaAllowlist?: unknown };
	const mode = WAREHOUSE_MODES.includes(b.warehouseMode as WarehouseMode)
		? (b.warehouseMode as WarehouseMode)
		: 'managed';
	const schemaAllowlist = Array.isArray(b.schemaAllowlist)
		? b.schemaAllowlist.filter((s): s is string => typeof s === 'string')
		: [];
	return { mode, schemaAllowlist };
}

const WAREHOUSE_LABELS: Record<WarehouseMode, string> = {
	managed: 'Evidence',
	snowflake: 'Snowflake',
	bigquery: 'BigQuery',
	fabric: 'Microsoft Fabric',
	clickhouse: 'ClickHouse',
	databricks: 'Databricks',
	postgres: 'PostgreSQL',
	cube: 'Cube',
	motherduck: 'MotherDuck'
};

export function warehouseLabel(mode: WarehouseMode): string {
	return WAREHOUSE_LABELS[mode];
}

export function warehouseTypeForMode(mode: WarehouseMode): WarehouseType | null {
	return mode === 'managed' ? null : mode;
}

export type NativeQueryOutcome =
	| { ok: true; rows: Record<string, unknown>[]; columns: Column[] }
	| { ok: false; error: string; status: number };

export async function queryNative(
	studioHost: string,
	authCookie: string,
	sql: string
): Promise<NativeQueryOutcome> {
	const response = await fetchStudio(`${studioHost}/query/native`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Cookie: authCookie },
		body: JSON.stringify({ query: sql })
	});
	return parseNativeQueryResponse(response.status, await response.text());
}

export function parseNativeQueryResponse(status: number, text: string): NativeQueryOutcome {
	// An expired session redirects to sign-in rather than 401-ing.
	if (status === 401 || status === 403 || (status >= 300 && status < 400)) {
		return { ok: false, error: 'Session expired. Please log in again.', status: 401 };
	}

	let data: {
		result?: { rows?: Record<string, unknown>[]; columns?: Column[] };
		error?: string;
		message?: string;
	};
	try {
		data = JSON.parse(text);
	} catch {
		return {
			ok: false,
			error: `Native query error (${status}): ${text}`,
			status: status >= 400 ? status : 500
		};
	}

	if (status < 200 || status >= 300) {
		return {
			ok: false,
			error: data.message || data.error || `Native query error (${status})`,
			status
		};
	}
	// SQL errors come back as 200 with `error` set.
	if (data.error) return { ok: false, error: data.error, status: 400 };

	return { ok: true, rows: data.result?.rows ?? [], columns: data.result?.columns ?? [] };
}
