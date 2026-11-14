/**
 * Coupler.io Public API client (v1).
 *
 * Every call is workspace-scoped (/v1/workspaces/{workspace_id}/…). The API
 * allows 100 requests per minute per organization, shared by every token and
 * client, and a page load runs all of its queries at once, so requests go
 * through a scheduler that caps concurrency and request rate, pauses everything
 * on a 429, and lets page queries run ahead of schema-browser lookups. The
 * catalog, dataset schemas and query results are cached for a few minutes.
 */

import type { Column } from '../../user-components/interfaces/query-service';
import type { CouplerIoCredentials } from './credentials';
import {
	slugifyTableName,
	viewColumnsFromApi,
	type CouplerIoApiColumn,
	type CouplerIoViewColumn
} from './sql';

const CACHE_TTL_MS = 5 * 60_000;
// Distinct statements (each filter combination is one), each up to 10,000 rows.
const MAX_CACHED_RESULTS = 200;

// The API allows 100 requests/minute per organization; keep headroom for other
// clients (the app, MCP) sharing that allowance.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 90;
// Schema-browser backfill may use only part of that, so a workspace with many
// datasets can't take the whole organization's allowance.
const LOW_PRIORITY_REQUESTS = 30;
// 429 retries: Retry-After when the API sends it, else 15s, 30s, 60s.
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 15_000;
// The API gives a query 60s; past this the connection is stalled, and a stalled
// request would hold its concurrency slot forever.
const REQUEST_TIMEOUT_MS = 90_000;

/**
 * `high` for queries a page is waiting on; `low` for schema-browser backfill,
 * which can fan out to one request per dataset and shouldn't delay queries.
 */
export type Priority = 'high' | 'low';

export type CatalogEntry = { name: string; datasetId: string; rowsCount: number | null };

export type CouplerIoResult = { rows: Record<string, unknown>[]; columns: Column[] };

export class CouplerIoApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}

export class DatasetNotQueryableError extends Error {}

type DatasetResponse = {
	id: string;
	name: string;
	state?: string;
	queryable?: boolean;
	rows_count?: number;
	columns?: CouplerIoApiColumn[];
};

/**
 * Promises cached for a fixed time, so concurrent callers share one in-flight
 * request. A rejected promise is dropped (the next caller retries); expired
 * entries are swept on every insert, and the oldest go first past `maxEntries`.
 */
export class PromiseCache<K, V> {
	// Insertion order is age order: set() always re-inserts at the end.
	#entries = new Map<K, { at: number; value: Promise<V> }>();

	constructor(
		readonly ttlMs: number,
		readonly maxEntries = Infinity
	) {}

	get size(): number {
		return this.#entries.size;
	}

	get(key: K): Promise<V> | undefined {
		const entry = this.#entries.get(key);
		if (!entry) return undefined;
		if (Date.now() - entry.at < this.ttlMs) return entry.value;
		this.#entries.delete(key);
		return undefined;
	}

	set(key: K, value: Promise<V>): Promise<V> {
		this.#entries.delete(key);
		this.#entries.set(key, { at: Date.now(), value });
		const now = Date.now();
		for (const [k, entry] of this.#entries) {
			if (now - entry.at < this.ttlMs && this.#entries.size <= this.maxEntries) break;
			this.#entries.delete(k);
		}
		value.catch(() => {
			if (this.#entries.get(key)?.value === value) this.#entries.delete(key);
		});
		return value;
	}

	getOrLoad(key: K, load: () => Promise<V>): Promise<V> {
		return this.get(key) ?? this.set(key, load());
	}
}

export class CouplerIoClient {
	#catalog = new PromiseCache<'catalog', Map<string, CatalogEntry>>(CACHE_TTL_MS);
	#views = new PromiseCache<string, CouplerIoViewColumn[]>(CACHE_TTL_MS);
	/** Dataset ids whose cached schema is a still-queued low-priority lookup. */
	#lowPriorityViews = new Set<string>();
	#results = new PromiseCache<string, CouplerIoResult>(CACHE_TTL_MS, MAX_CACHED_RESULTS);
	#active = 0;
	#queues: Record<Priority, (() => void)[]> = { high: [], low: [] };
	/** Start times of requests in the current rate-limit window, oldest first. */
	#starts: Record<Priority, number[]> = { high: [], low: [] };
	/** After a 429, no request starts before this time. */
	#pausedUntil = 0;
	#wakeTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(readonly config: CouplerIoCredentials) {}

	/**
	 * Wait for a request slot: at most `maxConcurrentRequests` in flight and
	 * RATE_LIMIT_REQUESTS started per window (LOW_PRIORITY_REQUESTS of them low
	 * priority), high priority first.
	 */
	#acquire(priority: Priority): Promise<void> {
		return new Promise((resolve) => {
			this.#queues[priority].push(resolve);
			this.#pump();
		});
	}

	#release() {
		this.#active--;
		this.#pump();
	}

	#pump() {
		while (this.#active < this.config.maxConcurrentRequests) {
			const priority: Priority = this.#queues.high.length > 0 ? 'high' : 'low';
			const queue = this.#queues[priority];
			if (queue.length === 0) return;
			const now = Date.now();
			for (const starts of Object.values(this.#starts)) {
				while (starts.length > 0 && now - starts[0] >= RATE_LIMIT_WINDOW_MS) starts.shift();
			}
			const { high, low } = this.#starts;
			let wakeAt = this.#pausedUntil;
			if (high.length + low.length >= RATE_LIMIT_REQUESTS) {
				wakeAt = Math.max(
					wakeAt,
					Math.min(high[0] ?? Infinity, low[0] ?? Infinity) + RATE_LIMIT_WINDOW_MS
				);
			}
			if (priority === 'low' && low.length >= LOW_PRIORITY_REQUESTS) {
				wakeAt = Math.max(wakeAt, low[0] + RATE_LIMIT_WINDOW_MS);
			}
			if (wakeAt > now) {
				this.#wakeAt(wakeAt - now);
				return;
			}
			// Take the slot here, not in the waiter, so a request starting before the
			// waiter resumes can't also claim it.
			this.#active++;
			this.#starts[priority].push(now);
			queue.shift()!();
		}
	}

	#wakeAt(delayMs: number) {
		if (this.#wakeTimer) return;
		this.#wakeTimer = setTimeout(() => {
			this.#wakeTimer = null;
			this.#pump();
		}, delayMs);
	}

	/** Call a Public API endpoint under /v1/workspaces/{workspace_id}. */
	async #api<T>(path: string, init: RequestInit = {}, priority: Priority = 'high'): Promise<T> {
		const url = `${this.config.apiHost}/v1/workspaces/${encodeURIComponent(this.config.workspaceId)}${path}`;
		for (let attempt = 0; ; attempt++) {
			await this.#acquire(priority);
			let response: Response;
			let text: string;
			try {
				response = await fetch(url, {
					...init,
					headers: {
						Authorization: `Bearer ${this.config.token}`,
						'Content-Type': 'application/json',
						Accept: 'application/json'
					},
					signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
				});
				text = await response.text();
			} catch (e) {
				if ((e as Error)?.name === 'TimeoutError') {
					throw new Error(
						`Coupler.io: no response from the API after ${REQUEST_TIMEOUT_MS / 1000}s. Check your connection and retry.`,
						{ cause: e }
					);
				}
				throw e;
			} finally {
				this.#release();
			}
			if (response.status === 429 && attempt < MAX_RETRIES) {
				// Pause every request, not just this one: the allowance is shared.
				const delay = retryAfterMs(response) ?? RETRY_BASE_MS * 2 ** attempt;
				this.#pausedUntil = Math.max(this.#pausedUntil, Date.now() + delay);
				continue;
			}
			if (!response.ok) {
				throw new CouplerIoApiError(response.status, errorMessage(response.status, text));
			}
			return JSON.parse(text) as T;
		}
	}

	query(datasetId: string, statement: string) {
		return this.#api<{ rows: Record<string, unknown>[]; truncated: boolean }>(
			`/datasets/${encodeURIComponent(datasetId)}/query`,
			{ method: 'POST', body: JSON.stringify({ statement }) }
		);
	}

	catalog(): Promise<Map<string, CatalogEntry>> {
		return this.#catalog.getOrLoad('catalog', () => this.#loadCatalog());
	}

	async #loadCatalog(): Promise<Map<string, CatalogEntry>> {
		const entries = new Map<string, CatalogEntry>();
		const explicit = Object.entries(this.config.tables);
		if (explicit.length > 0) {
			for (const [name, datasetId] of explicit) {
				entries.set(name.toLowerCase(), { name, datasetId, rowsCount: null });
			}
			return entries;
		}

		// Auto-discovery: every queryable dataset, named after the dataset. The API
		// returns at most 200, newest successful run first.
		const list = await this.#api<{ datasets: DatasetResponse[] }>('/datasets');
		for (const d of list.datasets.filter((d) => d.queryable)) {
			let name = slugifyTableName(d.name);
			if (entries.has(name)) name = `${name}_${d.id.slice(0, 8).toLowerCase()}`;
			entries.set(name, { name, datasetId: d.id, rowsCount: d.rows_count ?? null });
		}
		return entries;
	}

	/** Memoize a query result by dataset + statement (in-flight requests are shared too). */
	cachedResult(datasetId: string, statement: string, run: () => Promise<CouplerIoResult>) {
		return this.#results.getOrLoad(JSON.stringify([datasetId, statement]), run);
	}

	viewColumns(datasetId: string, priority: Priority = 'high'): Promise<CouplerIoViewColumn[]> {
		const cached = this.#views.get(datasetId);
		// A query shouldn't wait behind a still-queued schema-browser fetch: issue its own.
		const demoted = priority === 'high' && this.#lowPriorityViews.has(datasetId);
		if (cached && !demoted) return cached;

		if (priority === 'low') this.#lowPriorityViews.add(datasetId);
		else this.#lowPriorityViews.delete(datasetId);
		const value = this.#api<DatasetResponse>(
			`/datasets/${encodeURIComponent(datasetId)}`,
			{},
			priority
		).then((d) => {
			if (d.queryable === false) {
				throw new DatasetNotQueryableError(
					`Coupler.io dataset "${d.name}" (${datasetId}) is not queryable (state: ${d.state}). Share it for analysis in the dataflow destination, or run the dataflow.`
				);
			}
			return viewColumnsFromApi(d.columns ?? []);
		});
		if (priority === 'low') {
			const settle = () => {
				if (this.#views.get(datasetId) === value) this.#lowPriorityViews.delete(datasetId);
			};
			value.then(settle, settle);
		}
		return this.#views.set(datasetId, value);
	}
}

/** Retry-After (seconds or HTTP date) in ms, when the response has a usable one. */
function retryAfterMs(response: Response): number | null {
	const header = response.headers.get('retry-after');
	if (!header) return null;
	const seconds = Number(header);
	if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
	const date = Date.parse(header);
	return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function errorMessage(status: number, body: string): string {
	let message = body;
	try {
		message = JSON.parse(body)?.error?.message ?? body;
	} catch {
		// Non-JSON body — keep it verbatim.
	}
	switch (status) {
		case 401:
			return `Coupler.io: API token is missing or invalid. ${message}`;
		case 403:
			return `Coupler.io: access denied (check the workspace id, that your plan includes the Public API, and that the dataset is shared for analysis). ${message}`;
		case 429:
			return 'Coupler.io: API rate limit exceeded (100 requests/minute per organization). Retried 3 times; wait a minute and reload.';
		case 504:
			return 'Coupler.io: the query timed out (60s limit). Filter or aggregate to make it cheaper.';
		default:
			return `Coupler.io (${status}): ${message}`;
	}
}
