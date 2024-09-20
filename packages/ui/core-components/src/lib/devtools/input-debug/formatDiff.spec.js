import { beforeEach, describe, expect, it } from 'vitest';
import { formatDiff } from './formatDiff.js';
import { History } from '@evidence-dev/sdk/utils';

describe('formatDiff', () => {
	let history = new History();
	beforeEach(() => {
		history = new History();
	});
	it('should be a function', () => {
		expect(typeof formatDiff).toBe('function');
	});

	it('should output while retaining JSON indenting', () => {
		history.push({ a: 1 });
		history.push({ a: 1 });

		const output = formatDiff(history.generations[0]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '  "a": 1', type: 'added' },
			{ content: '}', type: 'unchanged' }
		]);
	});
	it('should correctly flag added lines', () => {
		history.push({ a: 1 });
		history.push({ a: 1, b: 2 });

		const output = formatDiff(history.generations[1]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '  "a": 1,', type: 'unchanged' },
			{ content: '  "b": 2', type: 'added' },
			{ content: '}', type: 'unchanged' }
		]);
	});

	it('should correctly flag deleted lines', () => {
		history.push({ a: 1, b: 2 });
		history.push({ a: 1 });

		const output = formatDiff(history.generations[1]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '  "a": 1,', type: 'unchanged' },
			{ content: '  "b": 2', type: 'deleted' },
			{ content: '}', type: 'unchanged' }
		]);
	});

	it('should correctly flag updated lines', () => {
		history.push({ a: 1, b: 2 });
		history.push({ a: 1, b: 3 });

		const output = formatDiff(history.generations[1]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '  "a": 1,', type: 'unchanged' },
			{ content: '  "b": 3', type: 'updated' },
			{ content: '}', type: 'unchanged' }
		]);
	});

	it('should handle nested objects', () => {
		history.push({ a: 1, b: 2 });
		history.push({ a: 1, b: { c: 3 } });

		const output = formatDiff(history.generations[1]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '  "a": 1,', type: 'unchanged' },
			{ content: '  "b": {', type: 'unchanged' },
			{ content: '    "c": 3', type: 'updated' },
			{ content: '  }', type: 'unchanged' },
			{ content: '}', type: 'unchanged' }
		]);
	});

	it('should not clobber arrays (root value)', () => {
		history.push([]);

		const output = formatDiff(history.generations[0]);
		expect(output).toEqual([
			{ content: '{', type: 'deleted' },
			{ content: '[', type: 'added' },
			{ content: '}', type: 'deleted' },
			{ content: ']', type: 'added' }
		]);
	});
	it('should not clobber arrays (child value)', () => {
		history.push({ myArray: [] });

		const output = formatDiff(history.generations[0]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '  "myArray": [', type: 'added' },
			{ content: '  ]', type: 'added' },
			{ content: '}', type: 'unchanged' }
		]);
	});

	it('should not add keys to arrays', () => {
		history.push([]);
		history.push([1]);
		history.push([1, { x: 1 }]);

		const output = formatDiff(history.generations[2]);
		expect(output).toEqual([
			{ content: '[', type: 'unchanged' },
			{ content: '  1,', type: 'unchanged' },
			{ content: '  {', type: 'added' },
			{ content: '    "x": 1', type: 'added' },
			{ content: '  }', type: 'added' },
			{ content: ']', type: 'unchanged' }
		]);
	});
});
