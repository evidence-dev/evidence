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
	it.each([
		'http://example.com',
		'https://example.com',
		'ftp://example.com/file.txt',
		'mailto:someone@example.com',
		'tel:+1234567890',
		'file:///C:/path/to/file',
		'data:text/plain;base64,aGVsbG8gd29ybGQ=',
		'javascript:alert("Hello")',
		'blob:hajsfklayhslfjkahslfkahjslkf',
		'sms:+1234567890',
		'vscode:extension/Evidence.evidence-vscode',
		'someprotocol:',
		'someotherprotocol://'
	])('should not modify urls with a protocol (%s)', (href) => {
		basePath = '/base';
		expect(addBasePath(href, config)).toBe(href);
	});
	it('should add base path to relative path with colon in it', () => {
		basePath = '/base';
		expect(addBasePath('/test:123', config)).toBe('/base/test:123');
	});
	it('should properly handle String wrapper or non-string values', () => {
		basePath = '/base';
		expect(addBasePath(new String('/test'), config)).toBe('/base/test');
		expect(addBasePath(123, config)).toBe(123);
		expect(addBasePath(123n, config)).toBe(123n);
		expect(addBasePath(true, config)).toBe(true);
		expect(addBasePath(Symbol.for('test'), config)).toBe(Symbol.for('test'));
		const fn = () => {};
		expect(addBasePath(fn, config)).toBe(fn);
		expect(addBasePath(null, config)).toBe(null);
		expect(addBasePath(undefined, config)).toBe(undefined);
		const obj = {};
		expect(addBasePath(obj, config)).toBe(obj);
	});
});
