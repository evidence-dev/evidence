import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity, batchedAsyncGeneratorToArray } from '@evidence-dev/db-commons';
import 'dotenv/config';

test('query runs', async () => {
	if (process.env.MSSQL_DATABASE) {
		try {
			const { rows: row_generator, columnTypes } = await runQuery(
				"select 100 as number_col, GETDATE() as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, CAST(0 AS BIT) as bool_col",
				{
					user: process.env.MSSQL_USER,
					host: process.env.MSSQL_HOST,
					database: process.env.MSSQL_DATABASE,
					password: process.env.MSSQL_PASSWORD,
					port: process.env.MSSQL_PORT,
					trust_server_certificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE,
					encrypt: process.env.MSSQL_ENCRYPT
				}
			);
			const rows = await batchedAsyncGeneratorToArray(row_generator);
			assert.instance(rows, Array);
			assert.instance(columnTypes, Array);
			assert.type(rows[0], 'object');
			assert.equal(rows[0].number_col, 100);
			assert.equal(rows[0].bool_col, false);

			const actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
			const actualColumnNames = columnTypes.map((columnType) => columnType.name);
			const actualTypePrecisions = columnTypes.map((columnType) => columnType.typeFidelity);

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
		console.log('MSSQL tests not currently configured to run during the automated builds');
		return;
	}
});

test('query batches results properly', async () => {
	if (process.env.MSSQL_DATABASE) {
		try {
			const { rows, expectedRowCount } = await runQuery(
				'select 1 as one union all select 2 as two union all select 3 as three union all select 4 as four union all select 5 as five',
				{
					user: process.env.MSSQL_USER,
					host: process.env.MSSQL_HOST,
					database: process.env.MSSQL_DATABASE,
					password: process.env.MSSQL_PASSWORD,
					port: process.env.MSSQL_PORT,
					trust_server_certificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE,
					encrypt: process.env.MSSQL_ENCRYPT
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
		console.log('MSSQL tests not currently configured to run during the automated builds');
		return;
	}
});

test.run();
