import { describe, expect, it, vi } from 'vitest';
import { runAthenaQuery, type AthenaQueryApi, type AthenaQueryExecution } from './run-query';

const input = {
	QueryString: 'SELECT 1',
	WorkGroup: 'primary',
	QueryExecutionContext: { Catalog: 'AwsDataCatalog', Database: 'db' }
};

const row = (...values: string[]) => ({ Data: values.map((v) => ({ VarCharValue: v })) });

function fakeApi(states: string[], execution: Partial<AthenaQueryExecution> = {}) {
	let poll = 0;
	const api = {
		start: vi.fn(async () => ({ QueryExecutionId: 'q1' })),
		getExecution: vi.fn(async () => ({
			QueryExecution: {
				StatementType: 'DML',
				...execution,
				Status: { State: states[Math.min(poll++, states.length - 1)], ...execution.Status }
			}
		})),
		getResults: vi.fn(async (_id: string, nextToken: string | undefined) =>
			nextToken
				? { ResultSet: { Rows: [row('2')] } }
				: {
						ResultSet: {
							Rows: [row('n'), row('1')],
							ResultSetMetadata: { ColumnInfo: [{ Name: 'n', Type: 'integer' }] }
						},
						NextToken: 'page2'
					}
		),
		stop: vi.fn(async () => ({}))
	} satisfies AthenaQueryApi;
	return api;
}

describe('runAthenaQuery', () => {
	it('drops the header row from SELECT results and pages through the rest', async () => {
		const api = fakeApi(['RUNNING', 'SUCCEEDED']);
		const result = await runAthenaQuery(api, input, { timeoutMs: 5_000 });
		expect(result.columnInfo).toEqual([{ Name: 'n', Type: 'integer' }]);
		expect(result.rows).toEqual([row('1'), row('2')]);
		expect(api.stop).not.toHaveBeenCalled();
	});

	it('keeps the first row for non-SELECT statements', async () => {
		const api = fakeApi(['SUCCEEDED'], { StatementType: 'DDL' });
		const result = await runAthenaQuery(api, input, { timeoutMs: 5_000 });
		expect(result.rows).toEqual([row('n'), row('1'), row('2')]);
	});

	it("surfaces Athena's failure reason without stopping a finished query", async () => {
		const api = fakeApi(['FAILED'], { Status: { StateChangeReason: 'TABLE_NOT_FOUND' } });
		await expect(runAthenaQuery(api, input, { timeoutMs: 5_000 })).rejects.toThrow(
			'TABLE_NOT_FOUND'
		);
		expect(api.stop).not.toHaveBeenCalled();
	});

	it('stops a still-running query when the caller aborts', async () => {
		const api = fakeApi(['RUNNING']);
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 20);
		await expect(
			runAthenaQuery(api, input, { timeoutMs: 5_000, signal: controller.signal })
		).rejects.toThrow('aborted');
		expect(api.stop).toHaveBeenCalledWith('q1');
	});

	it('stops a still-running query on timeout', async () => {
		const api = fakeApi(['QUEUED']);
		await expect(runAthenaQuery(api, input, { timeoutMs: 50 })).rejects.toThrow('timed out');
		expect(api.stop).toHaveBeenCalledWith('q1');
	});
});
