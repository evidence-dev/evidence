import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.fn();

vi.mock('@google-cloud/bigquery', () => ({
	BigQuery: vi.fn(function BigQuery() {
		return { query: queryMock };
	})
}));

import { executeBigQueryQuery } from './bigquery.ts';
import type { BigQueryCredentials } from '@evidence/core/connectors/bigquery/credentials';

const adc = (extra: Partial<BigQueryCredentials> = {}): BigQueryCredentials =>
	({
		authType: 'adc',
		projectId: 'labels-verify',
		...extra
	}) as BigQueryCredentials;

describe('executeBigQueryQuery labels', () => {
	beforeEach(() => {
		queryMock.mockReset();
		queryMock.mockResolvedValue([[], null, { schema: { fields: [] } }]);
	});

	it('passes labels through to client.query()', async () => {
		await executeBigQueryQuery('SELECT 1', adc({ labels: { app: 'evidence', team: 'analytics' } }));

		expect(queryMock).toHaveBeenCalledTimes(1);
		expect(queryMock.mock.calls[0][0]).toMatchObject({
			query: 'SELECT 1',
			labels: { app: 'evidence', team: 'analytics' }
		});
	});

	it('omits meaningful labels when unset', async () => {
		await executeBigQueryQuery('SELECT 1', adc());

		expect(queryMock).toHaveBeenCalledTimes(1);
		expect(queryMock.mock.calls[0][0].labels).toBeUndefined();
	});
});
