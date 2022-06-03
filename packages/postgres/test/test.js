import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';

let results;

test('query runs', async () => {
    try{
        results = await runQuery("select 100 as number_col, now()::date  as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, true as bool_col");
        assert.instance(results.rows, Array);
        assert.instance(results.columnTypes, Array);
        assert.type(results.rows[0], "object");
        assert.equal(results.rows[0].num, 100);

        let actualColumnTypes = results.columnTypes.map(columnType => columnType.evidenceType);
        let expectedColumnTypes = ['number', 'date', 'date', 'string', 'boolean'];
        assert.equal(true, (expectedColumnTypes.length === actualColumnTypes.length && expectedColumnTypes.every((value, index) => value === actualColumnTypes[index])));
    } catch(e) {
        throw Error(e)
    }
})

test.run();