import { test } from 'uvu';
import { getRunner } from '../index.js';
import * as assert from 'uvu/assert';

test('empty query should not run', async () => {
	const runner = getRunner();
	try {
		await runner('', './test/files/empty.js');
	} catch (error) {
		assert.instance(error, Error);
		assert.is(error.message, 'No { data } object exported from JavaScript file.');
	}
});

test('should return data from simple.js', async () => {
	const runner = getRunner();
	const data = await runner('', './test/files/simple.js');
	assert.is(data.rows.length, 2);
	assert.is(data.rows[0].id, 1);
	assert.is(data.rows[0].name, 'John Doe');
	assert.is(data.rows[1].id, 2);
	assert.is(data.rows[1].name, 'Jane Doe');
});

test('should return data from sample endpoint', async () => {
	const runner = getRunner();
	const data = await runner('', './test/files/pokemon.js');
	assert.is(data.rows.length, 20);
	assert.is(data.rows[0].name, 'bulbasaur');
	assert.is(data.rows[0].url, 'https://pokeapi.co/api/v2/pokemon/1/');
	assert.is(data.rows[1].name, 'ivysaur');
	assert.is(data.rows[1].url, 'https://pokeapi.co/api/v2/pokemon/2/');
});

test('should throw good error if data is not exported', async () => {
	const runner = getRunner();
	try {
		await runner('', './test/files/noExport.js');
	} catch (error) {
		assert.instance(error, Error);
		assert.is(error.message, 'No { data } object exported from JavaScript file.');
	}
});

test('should throw js errors if js errors are thrown', async () => {
	const runner = getRunner();
	try {
		await runner('', './test/files/invalid.js');
	} catch (error) {
		assert.instance(error, Error);
		assert.is(error.message.startsWith(`Unexpected identifier`), true);
	}
});

test('javascript dates should be converted to evidence dates', async () => {
	const runner = getRunner();
	const data = await runner('', './test/files/dates.js');
	assert.is(data.rows[0].date.toISOString(), new Date('2024-01-01').toISOString());
});

test('js numbers should be converted to evidence numbers', async () => {
	const runner = getRunner();
	const data = await runner('', './test/files/numbers.js');
	assert.is(data.rows[0].number, 1);
});

test('js booleans should be converted to evidence booleans', async () => {
	const runner = getRunner();
	const data = await runner('', './test/files/bools.js');
	assert.is(data.rows[0].bool, true);
	assert.is(data.rows[1].bool, false);
});

test('js arrays should be converted to evidence arrays', async () => {
	const runner = getRunner();
	const data = await runner('', './test/files/arrays.js');
	assert.is(data.rows[0].array.length, 3);
	assert.is(data.rows[0].array[0], 1);
	assert.is(data.rows[0].array[1], 2);
	assert.is(data.rows[0].array[2], 3);
});

test('js objects should be converted to evidence objects', async () => {
	const runner = getRunner();
	const data = await runner('', './test/files/objects.js');
	assert.is(data.rows[0].object.name, 'John Doe');
	assert.is(data.rows[0].object.age, 30);
});

test.run();
