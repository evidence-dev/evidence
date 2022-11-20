import { test } from 'uvu'
import * as assert from 'uvu/assert'
import runQuery from '../index.cjs'
import { TypeFidelity } from '@evidence-dev/db-commons'
import 'dotenv/config'

let results

test('query runs', async () => {
  if (process.env.ATHENA_DATABASE) {
    results = await runQuery('SELECT 1 as integer_col, PI() as double_col, true as bool_col, \'nice\' as str_col, cast(\'2022-01-01\' as date) as date_col, now() as timestamp_col, cast(\'{"foo":1,"bar":["baz"]}\' as JSON) as json_col, ARRAY[1, 2, 3] as array_col,  MAP(ARRAY[\'foo\', \'bar\'], ARRAY[1, 2]) as map_col')
    assert.instance(results.rows, Array)
    assert.instance(results.columnTypes, Array)
    assert.type(results.rows[0], 'object')
    assert.equal(results.rows[0].integer_col, 1)

    const actualColumnTypes = results.columnTypes.map(columnType => columnType.evidenceType)
    const actualColumnNames = results.columnTypes.map(columnType => columnType.name)
    const actualTypePrecisions = results.columnTypes.map(columnType => columnType.typeFidelity)

    const expectedColumnTypes = ['number', 'number', 'boolean', 'varchar', 'date', 'date', 'varchar', 'varchar', 'varchar']
    const expectedColumnNames = ['integer_col', 'double_col', 'bool_col', 'str_col', 'date_col', 'date_col', 'timestamp_col', 'json_col', 'array_col', 'map_col']
    const expectedTypePrecision = [...Array(7).fill(TypeFidelity.PRECISE), ...Array(3).fill(TypeFidelity.INFERRED)]

    assert.equal(true, (expectedColumnTypes.length === actualColumnTypes.length && expectedColumnTypes.every((value, index) => value === actualColumnTypes[index])))
    assert.equal(true, (expectedColumnNames.length === actualColumnNames.length && expectedColumnNames.every((value, index) => value === actualColumnNames[index])))
    assert.equal(true, (expectedTypePrecision.length === actualTypePrecisions.length && expectedTypePrecision.every((value, index) => value === actualTypePrecisions[index])))
  } else {
    console.log('Athena tests not currently configured to run during the automated builds')
  }
})

test.run()
