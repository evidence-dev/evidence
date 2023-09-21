import { test } from 'uvu'
import * as assert from 'uvu/assert'
import runQuery from '../index.cjs'
import { TypeFidelity } from '@evidence-dev/db-commons'

const query = `
SELECT
CAST(true AS BOOLEAN) AS boolean_col,
CAST(1 AS TINYINT) AS tinyint_col,
CAST(1 AS SMALLINT) AS smallint_col,
CAST(1 AS INTEGER) AS integer_col,
CAST(1 AS BIGINT) AS bigint_col,
CAST(1.1 AS REAL) AS real_col,
CAST(1.1 AS DOUBLE) AS double_col,
CAST(1.1 AS DECIMAL) AS decimal_col,
CAST('a' AS VARCHAR) AS varchar_col,
CAST('a' AS CHAR) AS char_col,
X'65683F' AS varbinary_col,
CAST(json_object('a': 1, 'b': true) AS JSON) AS json_col,
DATE '2001-08-22' AS date_col,
TIME '10:00:00' AS time_col,
TIME '10:00:00 -08:00' AS time_with_timezone_col,
TIMESTAMP '2001-08-22 10:00:00' AS timestamp_col,
TIMESTAMP '2001-08-22 10:00:00 -08:00' AS timestamp_with_timezone_col,
INTERVAL '3' MONTH AS interval_year_to_month_col,
INTERVAL '2' DAY AS interval_day_to_second_col,
ARRAY[1, 2, 3] AS array_col,
MAP(ARRAY['foo', 'bar'], ARRAY[1, 2]) AS map_col,
CAST(ROW(1, 2.0) AS ROW(x BIGINT, y DOUBLE)) AS row_col,
IPADDRESS '2001:db8::1' AS ipaddress_col,
UUID '12151fd2-7586-11e9-8f9e-2a86e4085a59' AS uuid_col,
approx_set(1) AS hyper_log_log_col,
CAST(approx_set(1) AS P4HyperLogLog) AS p4_hyper_log_log_col,
qdigest_agg(1) AS q_digest_col,
ST_Point(0, 0) AS geometry_col,
to_spherical_geography(ST_Point(0, 0)) AS spherical_geography_col,
bing_tile_at(40.7492, 73.9675, 1) AS bing_tile_col,
1 AS "whitespace col"
`

test('query runs', async () => {
	const result = await runQuery(query)

	assert.instance(result.rows, Array)
	assert.instance(result.columnTypes, Array)
	assert.type(result.rows[0], 'object')
	assert.equal(result.rows[0].boolean_col, true)
	assert.equal(result.rows[0].tinyint_col, 1)

	const actualColumnTypes = result.columnTypes.map((columnType) => columnType.evidenceType)
	const actualColumnNames = result.columnTypes.map((columnType) => columnType.name)
	const actualTypePrecisions = result.columnTypes.map((columnType) => columnType.typeFidelity)

	const expectedColumnTypes = ['boolean', 'number', 'number', 'number', 'number', 'number', 'number', 'string', 'string', 'string', 'string', 'string', 'date', 'date', 'date', 'date', 'date', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', undefined, 'number']
	const expectedColumnNames = ['boolean_col', 'tinyint_col', 'smallint_col', 'integer_col', 'bigint_col', 'real_col', 'double_col', 'decimal_col', 'varchar_col', 'char_col', 'varbinary_col', 'json_col', 'date_col', 'time_col', 'time_with_timezone_col', 'timestamp_col', 'timestamp_with_timezone_col', 'interval_year_to_month_col', 'interval_day_to_second_col', 'array_col', 'map_col', 'row_col', 'ipaddress_col', 'uuid_col', 'hyper_log_log_col', 'p4_hyper_log_log_col', 'q_digest_col', 'geometry_col', 'spherical_geography_col', 'bing_tile_col', 'whitespace_col']
	const expectedTypePrecisions = Array(result.columnTypes.length).fill(TypeFidelity.PRECISE)

	assert.equal(actualColumnTypes, expectedColumnTypes)
	assert.equal(actualColumnNames, expectedColumnNames)
	assert.equal(actualTypePrecisions, expectedTypePrecisions)

})

test.run()
