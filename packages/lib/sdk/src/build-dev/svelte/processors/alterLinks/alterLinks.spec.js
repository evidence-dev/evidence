import { describe, expect, it, vi } from 'vitest';
/** @type {undefined | string} */
let basePath = undefined;

vi.mock('$evidence/config', () => ({
	config: {
		deployment: {
			get basePath() {
				return basePath;
			}
		}
	}
}));
vi.mock('../../../../configuration/getEvidenceConfig.js', () => ({
	getEvidenceConfig() {
		return {
			deployment: {
				get basePath() {
					return basePath;
				}
			}
		};
	}
}));

import { alterLinks } from './alterLinks.js';
describe('alterLinks', () => {
	it('should leave files without links untouched', () => {
		const content = '<div>test</div>';
		expect(alterLinks.markup({ content, filename: '+page.md' }).code).toBe(content);
	});
	it('should add the base path to a relative link', () => {
		basePath = '/base';
		const content = '<a href="/test">test</a>';
		expect(alterLinks.markup({ content, filename: '+page.md' }).code).toBe(
			'<a href="/base/test">test</a>'
		);
	});
	it('should add the base path to multiple relative links', () => {
		basePath = '/base';
		const content = '<a href="/test">test</a><a href="/test2">test2</a>';
		expect(alterLinks.markup({ content, filename: '+page.md' }).code).toBe(
			'<a href="/base/test">test</a><a href="/base/test2">test2</a>'
		);
	});
	it('should ignore absolute links', () => {
		basePath = '/base';
		const content = '<a href="https://example.com/test">test</a>';
		expect(alterLinks.markup({ content, filename: '+page.md' }).code).toBe(content);
	});
	it('should properly handle a mix of absolute and relative links', () => {
		basePath = '/base';
		const content = '<a href="https://example.com/test">test</a><a href="/test">test</a>';
		expect(alterLinks.markup({ content, filename: '+page.md' }).code).toBe(
			'<a href="https://example.com/test">test</a><a href="/base/test">test</a>'
		);
	});
});
