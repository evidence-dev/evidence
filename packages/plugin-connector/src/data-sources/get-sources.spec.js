import { getSources } from './get-sources';
import mockfs from 'mock-fs';
import { describe, it, expect, beforeEach } from 'vitest';

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

describe('getSources', () => {
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
