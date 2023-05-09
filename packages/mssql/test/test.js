import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity } from '@evidence-dev/db-commons';
import 'dotenv/config';

test('query runs', async () => {
	if (process.env.MYSQL_DATABASE) {
		try {
			const results = await runQuery(
				"select 100 as number_col, GETDATE() as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, CAST(0 AS BIT) as bool_col"
			);
			assert.instance(results.rows, Array);
			assert.instance(results.columnTypes, Array);
			assert.type(results.rows[0], 'object');
			assert.equal(results.rows[0].number_col, 100);
			assert.equal(results.rows[0].bool_col, false);

			const actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
			const actualColumnNames = results.columnTypes.map((columnType) => columnType.name);
			const actualTypePrecisions = results.columnTypes.map((columnType) => columnType.typeFidelity);

			const expectedColumnTypes = ['number', 'date', 'date', 'string', 'boolean'];
			const expectedColumnNames = [
				'number_col',
				'date_col',
				'timestamp_col',
				'string_col',
				'bool_col'
			];
			const expectedTypePrecision = Array(5).fill(TypeFidelity.PRECISE);

			assert.equal(
				true,
				expectedColumnTypes.length === actualColumnTypes.length &&
					expectedColumnTypes.every((value, index) => value === actualColumnTypes[index])
			);
			assert.equal(
				true,
				expectedColumnNames.length === actualColumnNames.length &&
					expectedColumnNames.every((value, index) => value === actualColumnNames[index])
			);
			assert.equal(
				true,
				expectedTypePrecision.length === actualTypePrecisions.length &&
					expectedTypePrecision.every((value, index) => value === actualTypePrecisions[index])
			);
		} catch (e) {
			throw Error(e);
		}
	} else {
		console.log('SQL Server tests not currently configured to run during the automated builds');
		return;
	}
});

test.run();
