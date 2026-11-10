import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CouplerIoCredentials } from './credentials';
import { CouplerIoClient, PromiseCache } from './client';

const config = (extra: Partial<CouplerIoCredentials> = {}): CouplerIoCredentials => ({
	token: 't',
	workspaceId: '9',
	apiHost: 'https://api.test',
	tables: { funnel: 'ds-funnel' },
	maxConcurrentRequests: 4,
	...extra
});

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify(body), { status, headers });

const queryOk = () => json({ rows: [{ x: 1 }], truncated: false });

/** Resolve every pending fetch/microtask without moving the clock. */
const flush = () => vi.advanceTimersByTimeAsync(0);

describe('CouplerIoClient request scheduling', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('retries a 429 after Retry-After and pauses other requests meanwhile', async () => {
		fetchMock.mockResolvedValueOnce(
			json({ error: { message: 'slow down' } }, 429, { 'Retry-After': '2' })
		);
		fetchMock.mockImplementation(async () => queryOk());
		const client = new CouplerIoClient(config());

		const first = client.query('ds', 'select 1');
		await flush();
		const second = client.query('ds', 'select 2');
		await flush();
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(2000);
		await expect(first).resolves.toEqual({ rows: [{ x: 1 }], truncated: false });
		await expect(second).resolves.toBeDefined();
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('backs off 15s, 30s, 60s without Retry-After, then gives up', async () => {
		fetchMock.mockImplementation(async () => json({ error: { message: 'slow down' } }, 429));
		const client = new CouplerIoClient(config());

		const result = client.query('ds', 'select 1');
		const assertion = expect(result).rejects.toThrow(/rate limit exceeded/);
		await flush();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(15_000);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(30_000);
		expect(fetchMock).toHaveBeenCalledTimes(3);
		await vi.advanceTimersByTimeAsync(59_999);
		expect(fetchMock).toHaveBeenCalledTimes(3);
		await vi.advanceTimersByTimeAsync(1);
		expect(fetchMock).toHaveBeenCalledTimes(4);
		await assertion;
	});

	it('starts at most 90 requests per minute', async () => {
		fetchMock.mockImplementation(async () => queryOk());
		const client = new CouplerIoClient(config({ maxConcurrentRequests: 50 }));

		const all = Array.from({ length: 95 }, (_, i) => client.query('ds', `select ${i}`));
		await flush();
		expect(fetchMock).toHaveBeenCalledTimes(90);
		await vi.advanceTimersByTimeAsync(59_999);
		expect(fetchMock).toHaveBeenCalledTimes(90);
		await vi.advanceTimersByTimeAsync(1);
		expect(fetchMock).toHaveBeenCalledTimes(95);
		await Promise.all(all);
	});

	it('never exceeds maxConcurrentRequests in flight', async () => {
		let inFlight = 0;
		let peak = 0;
		fetchMock.mockImplementation(async () => {
			peak = Math.max(peak, ++inFlight);
			await new Promise((r) => setTimeout(r, 100));
			inFlight--;
			return queryOk();
		});
		const client = new CouplerIoClient(config({ maxConcurrentRequests: 2 }));

		const all = Array.from({ length: 6 }, (_, i) => client.query('ds', `select ${i}`));
		await vi.advanceTimersByTimeAsync(1000);
		await Promise.all(all);
		expect(peak).toBe(2);
		expect(fetchMock).toHaveBeenCalledTimes(6);
	});

	it('runs queued queries before queued schema-browser lookups', async () => {
		const order: string[] = [];
		fetchMock.mockImplementation(async (url: string) => {
			order.push(url.includes('/query') ? 'query' : url.split('/').pop()!);
			await new Promise((r) => setTimeout(r, 10));
			return url.includes('/query') ? queryOk() : json({ id: 'x', name: 'x', columns: [] });
		});
		const client = new CouplerIoClient(config({ maxConcurrentRequests: 1 }));

		const lookups = ['a', 'b', 'c'].map((id) => client.viewColumns(id, 'low'));
		await flush();
		const query = client.query('ds', 'select 1');
		await vi.advanceTimersByTimeAsync(100);
		await Promise.all([...lookups, query]);
		expect(order).toEqual(['a', 'query', 'b', 'c']);
	});

	it('does not make a query wait behind a still-queued low-priority lookup', async () => {
		const order: string[] = [];
		fetchMock.mockImplementation(async (url: string) => {
			order.push(url.split('/').pop()!);
			await new Promise((r) => setTimeout(r, 10));
			return json({ id: 'x', name: 'x', columns: [{ dbName: 'c', schema: { type: 'integer' } }] });
		});
		const client = new CouplerIoClient(config({ maxConcurrentRequests: 1 }));

		const lookups = ['a', 'b', 'c'].map((id) => client.viewColumns(id, 'low'));
		await flush();
		const forQuery = client.viewColumns('c');
		await vi.advanceTimersByTimeAsync(100);
		await expect(forQuery).resolves.toEqual([{ name: 'c', duckType: 'BIGINT' }]);
		await Promise.all(lookups);
		expect(order.slice(0, 2)).toEqual(['a', 'c']);
	});
});

describe('CouplerIoClient request limits', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('times out a stalled request and frees its slot', async () => {
		fetchMock.mockImplementationOnce(async (_url: string, init: RequestInit) => {
			expect(init.signal).toBeInstanceOf(AbortSignal);
			throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
		});
		fetchMock.mockImplementation(async () => json({ rows: [], truncated: false }));
		const client = new CouplerIoClient(config({ maxConcurrentRequests: 1 }));

		await expect(client.query('ds', 'select 1')).rejects.toThrow(
			/no response from the API after 90s/
		);
		await expect(client.query('ds', 'select 2')).resolves.toEqual({ rows: [], truncated: false });
	});

	it('lets page queries through when schema lookups have used their budget', async () => {
		fetchMock.mockImplementation(async (url: string) =>
			url.endsWith('/query')
				? json({ rows: [], truncated: false })
				: json({ id: 'x', name: 'x', columns: [] })
		);
		const client = new CouplerIoClient(config({ maxConcurrentRequests: 50 }));

		const lookups = Array.from({ length: 35 }, (_, i) => client.viewColumns(`ds-${i}`, 'low'));
		await flush();
		expect(fetchMock).toHaveBeenCalledTimes(30);
		await expect(client.query('ds', 'select 1')).resolves.toBeDefined();
		expect(fetchMock).toHaveBeenCalledTimes(31);
		await vi.advanceTimersByTimeAsync(60_000);
		await Promise.all(lookups);
		expect(fetchMock).toHaveBeenCalledTimes(36);
	});
});

describe('PromiseCache', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('expires entries and sweeps stale ones on insert', async () => {
		const cache = new PromiseCache<string, number>(1000);
		cache.set('a', Promise.resolve(1));
		vi.advanceTimersByTime(1000);
		expect(cache.get('a')).toBeUndefined();
		cache.set('b', Promise.resolve(2));
		vi.advanceTimersByTime(1000);
		cache.set('c', Promise.resolve(3));
		expect(cache.size).toBe(1);
	});

	it('drops the oldest entries past its size cap', async () => {
		const cache = new PromiseCache<string, number>(60_000, 2);
		for (const k of ['a', 'b', 'c']) cache.set(k, Promise.resolve(1));
		expect(cache.size).toBe(2);
		expect(cache.get('a')).toBeUndefined();
		expect(await cache.get('c')).toBe(1);
	});

	it('shares in-flight loads and forgets rejected ones', async () => {
		const cache = new PromiseCache<string, number>(60_000);
		const load = vi.fn(() => Promise.reject(new Error('boom')));
		const first = cache.getOrLoad('k', load);
		const second = cache.getOrLoad('k', load);
		expect(second).toBe(first);
		await expect(first).rejects.toThrow('boom');
		expect(cache.get('k')).toBeUndefined();
		expect(load).toHaveBeenCalledTimes(1);
	});
});
