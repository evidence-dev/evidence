import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { batchedAsyncGeneratorToArray, TypeFidelity } from '@evidence-dev/db-commons';
import 'dotenv/config';

test('query runs', async () => {
	if (process.env.POSTGRES_DATABASE) {
		try {
			const { rows: row_generator, columnTypes } = await runQuery(
				"select 100 as number_col, now()::date  as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, true as bool_col",
				{
					host: process.env.POSTGRES_HOST,
					password: process.env.POSTGRES_PASSWORD,
					database: process.env.POSTGRES_DATABASE,
					user: process.env.POSTGRES_USER,
					port: process.env.POSTGRES_PORT,
					ssl: process.env.POSTGRES_SSL
				}
			);
			const rows = await batchedAsyncGeneratorToArray(row_generator);
			assert.instance(rows, Array);
			assert.instance(columnTypes, Array);
			assert.type(rows[0], 'object');
			assert.equal(rows[0].number_col, 100);

			let actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
			let actualColumnNames = columnTypes.map((columnType) => columnType.name);
			let actualTypePrecisions = columnTypes.map((columnType) => columnType.typeFidelity);

			let expectedColumnTypes = ['number', 'date', 'date', 'string', 'boolean'];
			let expectedColumnNames = [
				'number_col',
				'date_col',
				'timestamp_col',
				'string_col',
				'bool_col'
			];
			let expectedTypePrecision = Array(5).fill(TypeFidelity.PRECISE);

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
		console.log('POSTGRES tests not currently configured to run during the automated builds');
		return;
	}
});

test('query batches results properly', async () => {
	if (process.env.POSTGRES_DATABASE) {
		try {
			const { rows, expectedRowCount } = await runQuery(
				'select 1 union all select 2 union all select 3 union all select 4 union all select 5',
				{
					host: process.env.POSTGRES_HOST,
					password: process.env.POSTGRES_PASSWORD,
					database: process.env.POSTGRES_DATABASE,
					user: process.env.POSTGRES_USER,
					port: process.env.POSTGRES_PORT,
					ssl: process.env.POSTGRES_SSL
				},
				2
			);

			const arr = [];
			for await (const batch of rows()) {
				arr.push(batch);
			}
			for (const batch of arr.slice(0, -1)) {
				assert.equal(batch.length, 2);
			}
			assert.equal(arr[arr.length - 1].length, 1);
			assert.equal(expectedRowCount, 5);
		} catch (e) {
			throw Error(e);
		}
	} else {
		console.log('POSTGRES tests not currently configured to run during the automated builds');
		return;
	}
});

test.run();
