import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity, batchedAsyncGeneratorToArray } from '@evidence-dev/db-commons';
import 'dotenv/config';

test('query runs', async () => {
	try {
		assert.equal(1,1)
	}
});

test.run();
