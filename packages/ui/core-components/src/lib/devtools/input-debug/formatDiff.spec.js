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
	it('should output an empty diff on 2 lines', () => {
		history.push({});
		history.push({});

		const output = formatDiff(history.generations[1]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '}', type: 'unchanged' }
		]);
	});
	it('should output while retaining JSON indenting', () => {
		history.push({ a: 1 });
		history.push({ a: 1 });

		const output = formatDiff(history.generations[1]);
		expect(output).toEqual([
			{ content: '{', type: 'unchanged' },
			{ content: '  "a": 1', type: 'unchanged' },
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
});
