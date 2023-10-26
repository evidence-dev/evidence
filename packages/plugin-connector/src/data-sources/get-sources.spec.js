import { getSources, loadSourceOptions } from './get-sources';
import mockfs from 'mock-fs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('getSources', () => {
	beforeEach(() => {
		mockfs({
			sources: {
				sqlite: {
					'connection.yaml': `
# Optional; defaults to directory name
name: sqlite
table_prefix: test
# Connector Specific Options
options:
    path: ./test.db
    some_opt:
        env: MY_SNOWFLAKE_CREDS
# Connector Type
type: sqlite
# EVIDENCE_SOURCE_[source-name]_[option-name]
# EVIDENCE_SOURCE_SALES_PATH: /data/sales.db
# EVIDENCE_SOURCE_SALES_PATH: https://s3.acme.co/data/sales.db`
				}
			}
		});
	});

	it('should be defined', () => {
		expect(getSources).toBeDefined();
	});

	it('should return an array of DatasourceSpecs', async () => {
		const result = await getSources('sources');
		expect(result).toBeInstanceOf(Array);
		expect(result.length).toBe(1);
		expect(result[0].type).toEqual('sqlite');
	});
});

describe('loadSourceOptions', () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
	});
	it('should be defined', () => {
		expect(loadSourceOptions).toBeDefined();
	});
	it('should properly load an environment variable', () => {
		vi.stubEnv('EVIDENCE_SOURCE__test__value', 'Hello!');
		const result = loadSourceOptions('test');
		expect('value' in result).toBeTruthy();
		expect(result['value']).toEqual('Hello!');
	});

	it('should properly load an environment variable that has incorrect casing', () => {
		vi.stubEnv('EVIDENCE_SOURCE__TEST__value', 'Hello!');
		const result = loadSourceOptions('test');
		expect('value' in result).toBeTruthy();
		expect(result['value']).toEqual('Hello!');
	});

	it('should properly load an environment variable for a source that contains "_"', () => {
		vi.stubEnv('EVIDENCE_SOURCE__under_score__value', 'Hello!');
		const result = loadSourceOptions('under_score');
		expect('value' in result).toBeTruthy();
		expect(result['value']).toEqual('Hello!');
	});

	it('should allow options to contain "_"', () => {
		vi.stubEnv('EVIDENCE_SOURCE__TEST__value_with_underscore', 'Hello!');
		const result = loadSourceOptions('test');
		expect('value_with_underscore' in result).toBeTruthy();
		expect(result['value_with_underscore']).toEqual('Hello!');
	});

	it('should properly load an environment variable for a nested option', () => {
		vi.stubEnv('EVIDENCE_SOURCE__TEST__nested__value', 'Hello!');
		const result = loadSourceOptions('test');
		console.warn(result);
		expect('nested' in result).toBeTruthy();
		expect('value' in result['nested']).toBeTruthy();
		expect(result['nested']['value']).toEqual('Hello!');
	});
});
