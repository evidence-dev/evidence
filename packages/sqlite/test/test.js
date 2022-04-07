import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';

let results;

test('query runs', async () => {
    try{
        results = await runQuery("select 100 as num")
        assert.instance(results, Array)
        assert.type(results[0], "object")
        assert.equal(results[0].num, 100)
    } catch(e) {
        throw Error(e)
    }
})

test.run();
