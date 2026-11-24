import { describe, expect, it } from 'vitest';
import { resolveBigQueryCredentials } from './resolve';
import type { BigQueryConnection } from './connection-schema';

describe('resolveBigQueryCredentials labels', () => {
	it('forwards labels onto ADC credentials', async () => {
		const config = {
			type: 'bigquery',
			project: 'my-project',
			adc: true,
			datasets: ['analytics'],
			labels: { app: 'evidence', team: 'analytics' }
		} as BigQueryConnection;

		const credentials = await resolveBigQueryCredentials(config, { cwd: '/' });
		expect(credentials).toMatchObject({
			authType: 'adc',
			projectId: 'my-project',
			labels: { app: 'evidence', team: 'analytics' }
		});
	});

	it('forwards labels onto service-account credentials', async () => {
		const config = {
			type: 'bigquery',
			project: 'my-project',
			keyfile_json: { client_email: 'a@b.com', private_key: 'k' },
			datasets: ['analytics'],
			labels: { report: 'weekly' }
		} as BigQueryConnection;

		const credentials = await resolveBigQueryCredentials(config, { cwd: '/' });
		expect(credentials).toMatchObject({
			authType: 'service_account_json',
			projectId: 'my-project',
			labels: { report: 'weekly' }
		});
	});
});
