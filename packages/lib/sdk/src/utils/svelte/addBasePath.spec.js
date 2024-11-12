import { describe, expect, it } from 'vitest';
/** @type {undefined | string} */
let basePath = undefined;
const config = {
	deployment: {
		get basePath() {
			return basePath;
		}
	}
};

import { addBasePath } from './addBasePath.js';
describe('addBasePath', () => {
	it('should return path if basePath is not set', () => {
		basePath = undefined;
		expect(addBasePath('/test', config)).toBe('/test');
	});
	it('should return path with basePath if basePath is set', () => {
		basePath = '/base';
		expect(addBasePath('/test', config)).toBe('/base/test');
	});
	it('should leave absolute paths as is', () => {
		basePath = '/base';
		expect(addBasePath('https://example.com/test', config)).toBe('https://example.com/test');
	});
	it('should always delimit with only one /', () => {
		basePath = '/base/';
		expect(addBasePath('/test', config)).toBe('/base/test');
	});
	it('should always start with /', () => {
		basePath = 'base';
		expect(addBasePath('/test', config)).toBe('/base/test');
	});
	it('should pass through undefined', () => {
		basePath = '/base';
		expect(addBasePath(undefined)).toBe(undefined);
	});
	it('should not double up the base path', () => {
		basePath = '/base';
		expect(addBasePath('/base/test', config)).toBe('/base/test');
	});
	it('should not modify hash links', () => {
		basePath = '/base';
		expect(addBasePath('#test', config)).toBe('#test');
	});
	it('should not modify mailto links', () => {
		basePath = '/base';
		expect(addBasePath('mailto:user@evidence.dev', config)).toBe('mailto:user@evidence.dev');
	});
});
