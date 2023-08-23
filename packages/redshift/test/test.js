import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { testQueryResults } from '@evidence-dev/db-commons';

let results;

test('query runs', async () => {
	try {
		results = await runQuery(
			"select 100 as number_col, now()::date  as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, true as bool_col"
		);
		assert.instance(results.rows, Array);
		assert.instance(results.columnTypes, Array);
		assert.type(results.rows[0], 'object');
		assert.equal(results.rows[0].number_col, 100);

		const expectedColumnTypes = ['number', 'date', 'date', 'string', 'boolean'];
		const expectedColumnNames = [
			'number_col',
			'date_col',
			'timestamp_col',
			'string_col',
			'bool_col'
		];

		testQueryResults(results, expectedColumnTypes, expectedColumnNames);
	} catch (e) {
		throw Error(e);
	}
});

test.run();
