import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import 'dotenv/config';
import { testQueryResults } from '@evidence-dev/db-commons';

let results;

test('query runs', async () => {
	if (process.env.MYSQL_DATABASE) {
		try {
			results = await runQuery(`
				SELECT
					18446744073709551615 as bigint_col,
					CAST(1 AS DECIMAL) as decimal_col,
					CAST(1.5 AS FLOAT) as float_col,
					CAST(1.5 AS DOUBLE) as double_col,
					b'1' as bit_col,
					DATE '2020-01-01' as date_col,
					TIMESTAMP '2020-01-01 10:00:00' as timestamp_col,
					TIME '10:00:00' as time_col,
					CAST(NOW() AS YEAR) as year_col,
					CAST(NOW() AS DATETIME) as datetime_col,
					'hello' as varchar_col
			`);
			assert.instance(results.rows, Array);
			assert.instance(results.columnTypes, Array);
			assert.type(results.rows[0], 'object');

			const expectedColumnTypes = [
				'number',
				'number',
				'number',
				'number',
				'string',
				'date',
				'date',
				'string',
				'number',
				'date',
				'string'
			];
			const expectedColumnNames = [
				'bigint_col',
				'decimal_col',
				'float_col',
				'double_col',
				'bit_col',
				'date_col',
				'timestamp_col',
				'time_col',
				'year_col',
				'datetime_col',
				'varchar_col'
			];

			testQueryResults(results, expectedColumnTypes, expectedColumnNames);
		} catch (e) {
			throw Error(e);
		}
	} else {
		console.log('MySQL tests not currently configured to run during the automated builds');
		return;
	}
});

test.run();
