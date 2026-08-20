import { describe, it, expect } from 'vitest';
import { snowflakeConnectionSchema, bigqueryConnectionSchema } from './connection-schema';
import { notTemplatePlaceholder } from './connection-placeholder';

const sf = {
	type: 'snowflake',
	account: 'xy12345.us-east-1',
	user: 'me',
	password: 'secret',
	warehouse: 'wh',
	database: 'db'
};

const bq = {
	type: 'bigquery',
	project: 'my-project',
	keyfile_json: { client_email: 'a@b.com', private_key: 'k' },
	datasets: ['analytics']
};

describe('notTemplatePlaceholder', () => {
	it('rejects fully-wrapped <...> template values', () => {
		expect(notTemplatePlaceholder('<account>')).toBe(false);
		expect(notTemplatePlaceholder('  <warehouse>  ')).toBe(false);
	});

	it('accepts real values (incl. partial angle brackets)', () => {
		expect(notTemplatePlaceholder('xy12345.us-east-1')).toBe(true);
		expect(notTemplatePlaceholder('a<b')).toBe(true);
		expect(notTemplatePlaceholder('p@ss<word')).toBe(true);
	});
});

describe('snowflake schema placeholder rejection', () => {
	it('accepts a fully-filled config', () => {
		expect(snowflakeConnectionSchema.safeParse(sf).success).toBe(true);
	});

	it('rejects unfilled placeholders on non-secret fields', () => {
		for (const field of ['account', 'user', 'warehouse', 'database']) {
			const result = snowflakeConnectionSchema.safeParse({ ...sf, [field]: `<${field}>` });
			expect(result.success, field).toBe(false);
		}
	});

	it('does NOT reject a password that happens to look like a placeholder', () => {
		expect(snowflakeConnectionSchema.safeParse({ ...sf, password: '<sup3r>' }).success).toBe(true);
	});
});

describe('bigquery schema placeholder rejection', () => {
	it('accepts a fully-filled config', () => {
		expect(bigqueryConnectionSchema.safeParse(bq).success).toBe(true);
	});

	it('rejects placeholder project and dataset entries', () => {
		expect(bigqueryConnectionSchema.safeParse({ ...bq, project: '<project-id>' }).success).toBe(
			false
		);
		expect(bigqueryConnectionSchema.safeParse({ ...bq, datasets: ['<dataset>'] }).success).toBe(
			false
		);
	});
});
