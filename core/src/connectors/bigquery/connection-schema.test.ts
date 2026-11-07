import { describe, expect, it } from 'vitest';
import { bigqueryConnectionSchema } from './connection-schema';

const base = {
	type: 'bigquery' as const,
	project: 'my-project',
	keyfile_json: { client_email: 'a@b.com', private_key: 'k' },
	datasets: ['analytics']
};

describe('bigqueryConnectionSchema labels', () => {
	it('accepts an optional labels map', () => {
		const result = bigqueryConnectionSchema.safeParse({
			...base,
			labels: { app: 'evidence', team: 'analytics' }
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.labels).toEqual({ app: 'evidence', team: 'analytics' });
		}
	});

	it('rejects empty label keys', () => {
		const result = bigqueryConnectionSchema.safeParse({
			...base,
			labels: { '': 'x' }
		});
		expect(result.success).toBe(false);
	});

	it('omits labels when unset', () => {
		const result = bigqueryConnectionSchema.safeParse(base);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.labels).toBeUndefined();
		}
	});
});
