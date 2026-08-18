import { describe, it, expect } from 'vitest';
import { clickhouseConnectionSchema } from './connection-schema';

describe('clickhouseConnectionSchema', () => {
	const valid = {
		type: 'clickhouse' as const,
		host: 'abc123.us-east-1.aws.clickhouse.cloud',
		password: 'hunter2'
	};

	it('applies connection defaults', () => {
		const parsed = clickhouseConnectionSchema.parse(valid);
		expect(parsed.port).toBe(8443);
		expect(parsed.secure).toBe(true);
		expect(parsed.database).toBe('default');
		expect(parsed.username).toBe('default');
		expect(parsed.databases).toEqual([]);
	});

	it('trims the host and rejects a host that includes a scheme', () => {
		expect(
			clickhouseConnectionSchema.parse({ ...valid, host: '  abc.clickhouse.cloud  ' }).host
		).toBe('abc.clickhouse.cloud');

		const withScheme = clickhouseConnectionSchema.safeParse({
			...valid,
			host: 'https://abc.clickhouse.cloud'
		});
		expect(withScheme.success).toBe(false);
	});

	it('requires exactly one credential (password XOR access_token)', () => {
		// neither
		expect(clickhouseConnectionSchema.safeParse({ type: 'clickhouse', host: 'h' }).success).toBe(
			false
		);

		// both
		expect(
			clickhouseConnectionSchema.safeParse({
				type: 'clickhouse',
				host: 'h',
				password: 'p',
				access_token: 'jwt'
			}).success
		).toBe(false);

		// just password
		expect(clickhouseConnectionSchema.safeParse({ ...valid }).success).toBe(true);

		// just access token
		expect(
			clickhouseConnectionSchema.safeParse({ type: 'clickhouse', host: 'h', access_token: 'jwt' })
				.success
		).toBe(true);
	});

	it('rejects an out-of-range port', () => {
		expect(clickhouseConnectionSchema.safeParse({ ...valid, port: 70000 }).success).toBe(false);
		expect(clickhouseConnectionSchema.safeParse({ ...valid, port: 9440 }).success).toBe(true);
	});
});
