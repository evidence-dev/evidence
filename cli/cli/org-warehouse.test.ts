import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	clearOrgWarehouseCache,
	parseNativeQueryResponse,
	parseOrgWarehouse,
	resolveOrgWarehouse,
	warehouseTypeForMode
} from './org-warehouse.ts';

describe('parseOrgWarehouse', () => {
	it('accepts known native modes with their allowlist', () => {
		expect(parseOrgWarehouse({ warehouseMode: 'snowflake', schemaAllowlist: [] })).toEqual({
			mode: 'snowflake',
			schemaAllowlist: []
		});
		expect(
			parseOrgWarehouse({ warehouseMode: 'bigquery', schemaAllowlist: ['sales', 7, 'ops'] })
		).toEqual({ mode: 'bigquery', schemaAllowlist: ['sales', 'ops'] });
	});

	it('falls back to managed for unknown or malformed bodies', () => {
		expect(parseOrgWarehouse({ warehouseMode: 'oracle' })).toEqual({
			mode: 'managed',
			schemaAllowlist: []
		});
		expect(parseOrgWarehouse(null).mode).toBe('managed');
	});
});

describe('warehouseTypeForMode', () => {
	it('maps managed to the managed dialect (null) and natives to themselves', () => {
		expect(warehouseTypeForMode('managed')).toBeNull();
		expect(warehouseTypeForMode('snowflake')).toBe('snowflake');
	});
});

describe('parseNativeQueryResponse', () => {
	const columns = [{ name: 'N', clickhouseType: 'Int64', jsType: 'number' }];

	it('unwraps result rows and columns', () => {
		const body = JSON.stringify({ result: { rows: [{ N: 1 }], columns }, source: 'Snowflake' });
		expect(parseNativeQueryResponse(200, body)).toEqual({ ok: true, rows: [{ N: 1 }], columns });
	});

	it('surfaces SQL errors reported in a 200 body', () => {
		const body = JSON.stringify({
			result: { rows: [], columns: [] },
			error: "Database 'PROD' does not exist or not authorized."
		});
		expect(parseNativeQueryResponse(200, body)).toEqual({
			ok: false,
			error: "Database 'PROD' does not exist or not authorized.",
			status: 400
		});
	});

	it('treats auth failures and sign-in redirects as an expired session', () => {
		for (const status of [401, 403, 302]) {
			expect(parseNativeQueryResponse(status, '')).toMatchObject({ ok: false, status: 401 });
		}
	});

	it('reports HTTP errors with the server message', () => {
		expect(
			parseNativeQueryResponse(400, JSON.stringify({ message: 'Invalid request body' }))
		).toEqual({ ok: false, error: 'Invalid request body', status: 400 });
	});

	it('reports non-JSON bodies verbatim', () => {
		expect(parseNativeQueryResponse(502, 'Bad Gateway')).toEqual({
			ok: false,
			error: 'Native query error (502): Bad Gateway',
			status: 502
		});
	});
});

describe('resolveOrgWarehouse caching', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
		clearOrgWarehouseCache();
	});

	it('remembers a failed lookup briefly so an offline Studio is not re-asked per query', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockRejectedValue(new Error('ENOTFOUND'));
		vi.stubGlobal('fetch', fetchMock);

		expect((await resolveOrgWarehouse('https://studio', 'org_1', 'wos-session=x')).mode).toBe(
			'managed'
		);
		await resolveOrgWarehouse('https://studio', 'org_1', 'wos-session=x');
		expect(fetchMock).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(61_000);
		await resolveOrgWarehouse('https://studio', 'org_1', 'wos-session=x');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('keeps a successful lookup longer than a failed one', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify({ warehouseMode: 'snowflake', schemaAllowlist: [] }))
			);
		vi.stubGlobal('fetch', fetchMock);

		expect((await resolveOrgWarehouse('https://studio', 'org_1', 'wos-session=x')).mode).toBe(
			'snowflake'
		);
		vi.advanceTimersByTime(61_000);
		expect((await resolveOrgWarehouse('https://studio', 'org_1', 'wos-session=x')).mode).toBe(
			'snowflake'
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
