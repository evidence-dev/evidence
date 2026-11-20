import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COUPLER_IO_COLUMNS_SQL } from '../../metadata/coupler-io-catalog';
import type { CouplerIoCredentials } from './credentials';
import { CouplerIoClient } from './client';
import { runCouplerIoQuery } from './run-query';

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

describe('runCouplerIoQuery schema catalog', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	const dataset = (id: string, extra: object = {}) =>
		json({
			id,
			name: id,
			queryable: true,
			columns: [{ dbName: 'v', schema: { type: 'number' } }],
			...extra
		});

	it('fetches every table schema concurrently and skips unreadable datasets', async () => {
		let inFlight = 0;
		let peak = 0;
		fetchMock.mockImplementation(async (url: string) => {
			peak = Math.max(peak, ++inFlight);
			await new Promise((r) => setTimeout(r, 5));
			inFlight--;
			const id = url.split('/').pop()!;
			if (id === 'ds-hidden') return dataset(id, { queryable: false, state: 'FULL' });
			if (id === 'ds-gone') return json({ error: { message: 'TransformationSet not found' } }, 404);
			return dataset(id);
		});

		const result = await runCouplerIoQuery(
			new CouplerIoClient(
				config({ tables: { a: 'ds-a', b: 'ds-b', hidden: 'ds-hidden', gone: 'ds-gone' } })
			),
			COUPLER_IO_COLUMNS_SQL
		);

		expect(result.rows).toEqual([
			{ tableName: 'a', columnName: 'v', columnType: 'DOUBLE' },
			{ tableName: 'b', columnName: 'v', columnType: 'DOUBLE' }
		]);
		expect(peak).toBe(4);
		expect(console.warn).toHaveBeenCalledTimes(2);
	});

	it('fails on auth errors instead of returning an empty schema', async () => {
		fetchMock.mockImplementation(async () =>
			json({ error: { message: 'Credentials may be invalid' } }, 401)
		);
		await expect(
			runCouplerIoQuery(
				new CouplerIoClient(config({ tables: { a: 'ds-a' } })),
				COUPLER_IO_COLUMNS_SQL
			)
		).rejects.toThrow(/API token is missing or invalid/);
	});
});

describe('runCouplerIoQuery statements', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn(async (url: string) =>
			url.endsWith('/query')
				? json({ rows: [{ month: '2026-09-01', mrr: 10.5 }], truncated: false })
				: json({
						id: 'ds-funnel',
						name: 'Funnel',
						queryable: true,
						columns: [
							{ key: 'month.0', dbName: 'month', schema: { type: 'string', format: 'date' } },
							{ key: 'mrr.0', dbName: 'mrr', schema: { type: 'number' } }
						]
					})
		);
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("sends the statement to the dataset's query endpoint over a typed view", async () => {
		const c = config();
		const result = await runCouplerIoQuery(new CouplerIoClient(c), 'select month, mrr from funnel');

		const [url, init] = fetchMock.mock.calls.at(-1)!;
		expect(url).toBe('https://api.test/v1/workspaces/9/datasets/ds-funnel/query');
		expect(init.method).toBe('POST');
		expect(init.headers.Authorization).toBe(`Bearer ${c.token}`);
		expect(JSON.parse(init.body)).toEqual({
			statement:
				'WITH "funnel" AS MATERIALIZED (SELECT TRY_CAST("month" AS DATE) AS "month", TRY_CAST("mrr" AS DOUBLE) AS "mrr" FROM data) select month, mrr from funnel'
		});
		expect(result.columns.map((col) => [col.name, col.jsType])).toEqual([
			['month', 'date'],
			['mrr', 'number']
		]);
		expect(result.rows).toEqual([{ month: '2026-09-01', mrr: 10.5 }]);
	});

	it('rejects a statement that reads two datasets', async () => {
		await expect(
			runCouplerIoQuery(
				new CouplerIoClient(config({ tables: { funnel: 'ds-funnel', ads: 'ds-ads' } })),
				'select * from funnel join ads using (month)'
			)
		).rejects.toThrow(/one dataset per statement/);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('runCouplerIoQuery table resolution', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn(async (url: string) =>
			url.endsWith('/query')
				? json({ rows: [{ column_name: 'v', column_type: 'DOUBLE' }], truncated: false })
				: json({ id: 'ds-funnel', name: 'Funnel', queryable: true, columns: [] })
		);
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('rejects a table no dataset serves instead of guessing a dataset', async () => {
		await expect(
			runCouplerIoQuery(new CouplerIoClient(config()), 'select count(*) from data')
		).rejects.toThrow(/no table named "data".*Tables: funnel/);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('runs SUMMARIZE of a table as a query over its typed view', async () => {
		await runCouplerIoQuery(new CouplerIoClient(config()), 'SUMMARIZE funnel');
		const [url, init] = fetchMock.mock.calls.at(-1)!;
		expect(url).toBe('https://api.test/v1/workspaces/9/datasets/ds-funnel/query');
		expect(JSON.parse(init.body).statement).toBe(
			'SUMMARIZE WITH "funnel" AS MATERIALIZED (SELECT * FROM data) SELECT * FROM funnel'
		);
	});

	it('describes only the newest auto-discovered datasets, within the low-priority budget', async () => {
		const datasets = Array.from({ length: 60 }, (_, i) => ({
			id: `ds-${i}`,
			name: `Dataset ${i}`,
			queryable: true
		}));
		fetchMock.mockImplementation(async (url: string) =>
			url.endsWith('/datasets')
				? json({ datasets })
				: json({ id: 'x', name: 'x', queryable: true, columns: [{ dbName: 'v' }] })
		);
		vi.useFakeTimers();
		try {
			const pending = runCouplerIoQuery(
				new CouplerIoClient(config({ tables: {}, maxConcurrentRequests: 50 })),
				COUPLER_IO_COLUMNS_SQL
			);
			// The dataset list, then at most 30 low-priority lookups in the first minute.
			await vi.advanceTimersByTimeAsync(0);
			expect(fetchMock).toHaveBeenCalledTimes(31);
			await vi.advanceTimersByTimeAsync(60_000);
			const result = await pending;
			expect(result.rows).toHaveLength(50);
			expect(fetchMock).toHaveBeenCalledTimes(51);
		} finally {
			vi.useRealTimers();
		}
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringMatching(/50 most recently refreshed of 60/)
		);
	});
});
