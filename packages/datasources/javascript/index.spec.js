import { describe, it, expect } from 'vitest';
import { getRunner } from './index.js';

describe('Runner Tests', () => {
	it('empty query should not run', async () => {
		const runner = getRunner();
		try {
			await runner('', './test/empty.js');
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe('No { data } object exported from JavaScript file.');
		}
	});

	it('should return data from simple.js', async () => {
		const runner = getRunner();
		const data = await runner('', './test/simple.js');
		expect(data.rows.length).toBe(2);
		expect(data.rows[0].id).toBe(1);
		expect(data.rows[0].name).toBe('John Doe');
		expect(data.rows[1].id).toBe(2);
		expect(data.rows[1].name).toBe('Jane Doe');
	});

	it('should return data from sample endpoint', async () => {
		const runner = getRunner();
		const data = await runner('', './test/pokemon.js');
		expect(data.rows.length).toBe(20);
		expect(data.rows[0].name).toBe('bulbasaur');
		expect(data.rows[0].url).toBe('https://pokeapi.co/api/v2/pokemon/1/');
		expect(data.rows[1].name).toBe('ivysaur');
		expect(data.rows[1].url).toBe('https://pokeapi.co/api/v2/pokemon/2/');
	});

	it('should throw good error if data is not exported', async () => {
		const runner = getRunner();
		try {
			await runner('', './test/noExport.js');
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe('No { data } object exported from JavaScript file.');
		}
	});

	it('should throw js errors if js errors are thrown', async () => {
		const runner = getRunner();
		try {
			await runner('', './test/invalid.js');
		} catch (error) {
			expect(error.name).toBe('Error');
			expect(
				error.message.startsWith(
					'Failed to parse source for import analysis because the content contains invalid JS syntax'
				)
			).toBe(true);
		}
	});

	it('javascript dates should be converted to evidence dates', async () => {
		const runner = getRunner();
		const data = await runner('', './test/dates.js');
		expect(data.rows[0].date.toISOString()).toBe(new Date('2024-01-01').toISOString());
	});

	it('js numbers should be converted to evidence numbers', async () => {
		const runner = getRunner();
		const data = await runner('', './test/numbers.js');
		expect(data.rows[0].number).toBe(1);
	});

	it('js booleans should be converted to evidence booleans', async () => {
		const runner = getRunner();
		const data = await runner('', './test/bools.js');
		expect(data.rows[0].bool).toBe(true);
		expect(data.rows[1].bool).toBe(false);
	});

	it('js arrays should be converted to evidence arrays', async () => {
		const runner = getRunner();
		const data = await runner('', './test/arrays.js');
		expect(data.rows[0].array.length).toBe(3);
		expect(data.rows[0].array[0]).toBe(1);
		expect(data.rows[0].array[1]).toBe(2);
		expect(data.rows[0].array[2]).toBe(3);
	});

	it('js objects should be converted to evidence objects', async () => {
		const runner = getRunner();
		const data = await runner('', './test/objects.js');
		expect(data.rows[0].object.name).toBe('John Doe');
		expect(data.rows[0].object.age).toBe(30);
	});
});
