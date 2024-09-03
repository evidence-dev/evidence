import mockfs from 'mock-fs';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { injectPartials } from './inject-partials.cjs';

export const filesystem = {
	partials: {
		'basic.md': 'partial'
	}
};

// Skipping tests because `mock-fs` has issues on node 20
// https://github.com/tschaub/mock-fs/issues/384
describe.skip('injectPartials', () => {
	beforeEach(() => {
		mockfs(filesystem);
	});
	afterEach(() => mockfs.restore());
	it('should return original string when there is no pattern', () => {
		const original = 'sample text';
		expect(injectPartials(original)).toBe(original);
	});

	it('should inject partial content each occurrence of the pattern in the string', () => {
		const original = 'This is a {@partial "basic.md"}.';
		const expected = `This is a ${filesystem.partials['basic.md']}.`;
		expect(injectPartials(original)).toBe(expected);
	});

	it('should return original string when the input string is empty', () => {
		const original = '';
		expect(injectPartials(original)).toBe(original);
	});

	it('should return only the content of the specified file when the string is only the pattern', () => {
		const original = '{@partial "basic.md"}';
		expect(injectPartials(original)).toBe(filesystem.partials['basic.md']);
	});

	it('should throw an error when the input is non-string type', () => {
		const original = 12345;
		// @ts-expect-error
		expect(() => injectPartials(original)).toThrow(TypeError);
	});
});
