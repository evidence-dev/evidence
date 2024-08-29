import { describe, expect, it } from 'vitest';
import { nameGenerator } from './nameGenerator.js';

describe('updateIdName', () => {
	it('should return a new string of ordered names', () => {
		const names = new Set();
		let namesArray = ['name', 'name', 'name', 'name'];

		for (const name of namesArray) {
			let idName = name;
			nameGenerator(name, idName, names);
		}
		namesArray = Array.from(names);
		expect(namesArray).toEqual(['name', 'name-2', 'name-3', 'name-4']);
	});
});
