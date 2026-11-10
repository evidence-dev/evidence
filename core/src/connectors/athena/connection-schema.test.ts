import { describe, expect, it } from 'vitest';
import { athenaConnectionSchema } from './connection-schema';
import { resolveAthenaCredentials } from './resolve';

const base = { type: 'athena', region_name: 'us-east-1', schema: 'analytics' };

describe('athenaConnectionSchema', () => {
	it('applies dbt-athena defaults', () => {
		const parsed = athenaConnectionSchema.parse(base);
		expect(parsed.work_group).toBe('primary');
		expect(parsed.database).toBe('awsdatacatalog');
		expect(parsed.result_reuse_minutes).toBe(60);
		expect(parsed.roles).toEqual([]);
	});

	it('rejects a region that is not an AWS region code', () => {
		expect(athenaConnectionSchema.safeParse({ ...base, region_name: 'evil.com/x' }).success).toBe(
			false
		);
	});

	it('requires access key id and secret together', () => {
		expect(
			athenaConnectionSchema.safeParse({ ...base, aws_access_key_id: 'AKIAEXAMPLE' }).success
		).toBe(false);
		expect(
			athenaConnectionSchema.safeParse({
				...base,
				aws_access_key_id: 'AKIAEXAMPLE',
				aws_secret_access_key: 'secret'
			}).success
		).toBe(true);
	});

	it('rejects malformed role ARNs and duplicate role names', () => {
		expect(
			athenaConnectionSchema.safeParse({ ...base, role_arn: 'arn:aws:s3:::bucket' }).success
		).toBe(false);
		const arn = 'arn:aws:iam::123456789012:role/sales';
		expect(
			athenaConnectionSchema.safeParse({
				...base,
				roles: [
					{ name: 'sales', role_arn: arn },
					{ name: 'sales', role_arn: arn }
				]
			}).success
		).toBe(false);
	});

	it('resolves to execution credentials', () => {
		const parsed = athenaConnectionSchema.parse({
			...base,
			aws_profile_name: 'dev',
			role_arn: 'arn:aws:iam::123456789012:role/evidence',
			s3_staging_dir: 's3://bucket/results/'
		});
		expect(resolveAthenaCredentials(parsed)).toEqual({
			region: 'us-east-1',
			profile: 'dev',
			roleArn: 'arn:aws:iam::123456789012:role/evidence',
			outputLocation: 's3://bucket/results/',
			workGroup: 'primary',
			catalog: 'awsdatacatalog',
			schema: 'analytics',
			schemas: [],
			resultReuseMinutes: 60
		});
	});
});
