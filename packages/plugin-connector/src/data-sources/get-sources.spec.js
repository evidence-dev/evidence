import { getSources, loadSourceOptions } from './get-sources';
import mockfs from 'mock-fs';
import { describe, it, expect, beforeEach } from 'vitest';

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
	it('should be defined', () => {
		expect(loadSourceOptions).toBeDefined();
	});
	it('should properly detect an environment variable', () => {
		process.env.EVIDENCE_SOURCE_TEST_value = 'Hello!';
		const result = loadSourceOptions('test');
		expect('value' in result).toBeTruthy();
		expect(result['value']).toEqual('Hello!');
	});
});
