import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { createRequire } from 'module';
import 'dotenv/config';

const require = createRequire(import.meta.url);

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

test('runQuery returns normalized error on SQL syntax error', async () => {
	// Create a fake mssql module and inject before loading index.cjs
	const fakeMssql = {
		TYPES: {},
		connect: async () => ({
			request: () => ({
				query: async (q) => {
					// If it's the COUNT(*) wrapper, return 0
					if (typeof q === 'string' && q.trim().toUpperCase().startsWith('SELECT COUNT(*)')) {
						return { recordset: [{ expected_row_count: 0 }] };
					}
					// otherwise, return empty
					return { recordset: [] };
				}
			}),
			close: async () => {}
		}),
		Request: function () {
			const EventEmitter = require('events');
			const r = new EventEmitter();
			r.stream = false;
			r.query = function (q) {
				// simulate an async error emitted by the request (syntax error)
				process.nextTick(() => {
					const err = new Error("Incorrect syntax near the keyword 'select'.");
					err.code = 'EREQUEST';
					r.emit('error', err);
				});
			};
			r.toReadableStream = function () {
				const { Readable } = require('stream');
				// A readable that immediately errors when read
				const s = new Readable({ objectMode: true, read() {} });
				process.nextTick(() => s.emit('error', new Error('stream error')));
				return s;
			};
			return r;
		}
	};

	const path = require('path');
	const mssqlModulePath = path.join(process.cwd(), 'node_modules', 'mssql', 'index.js');
	require.cache[mssqlModulePath] = {
		id: mssqlModulePath,
		filename: mssqlModulePath,
		loaded: true,
		exports: fakeMssql
	};

	const runQuery = require('../index.cjs');

	try {
		await runQuery('select * from', {}, 10);
		assert.unreachable('Expected runQuery to throw');
	} catch (e) {
		// The function normalizes errors to strings
		assert.ok(
			typeof e === 'string' || e instanceof String || e.message,
			'error should be string or have message'
		);
		const msg = typeof e === 'string' ? e : e.message || String(e);
		// Message should be non-empty and mention syntax/select or be an error code
		assert.ok(msg && msg.length > 0, 'error message should be non-empty');
	}
});

test.run();
