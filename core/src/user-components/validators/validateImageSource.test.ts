import { describe, it, expect } from 'vitest';
import { validateImageSource } from './validateImageSource';

const node = (attrs: Record<string, unknown>) => ({
	attributes: attrs,
	location: { start: { line: 1 }, end: { line: 1 } }
});

const run = (attrs: Record<string, unknown>) =>
	// @ts-expect-error config/context args unused by validateImageSource
	validateImageSource()(node(attrs), {}, undefined);

const messages = (attrs: Record<string, unknown>) => run(attrs).map((e) => e.message);

describe('validateImageSource', () => {
	it('accepts a static url with description', () => {
		expect(run({ url: 'https://a.com/x.png', description: 'A logo' })).toEqual([]);
	});

	it('accepts variable values — presence is all that matters', () => {
		expect(run({ url: '{{my_url}}', description: '{{my_desc}}' })).toEqual([]);
	});

	it('requires url and description in static mode', () => {
		expect(messages({})).toEqual([
			'url: Required unless data is provided',
			'description: Required'
		]);
	});

	it('flags query-only attributes without data', () => {
		expect(
			messages({
				url: 'https://a.com/x.png',
				description: 'A logo',
				column: 'image_url',
				filters: ['f1']
			})
		).toEqual(['column: Requires data', 'filters: Requires data']);
	});

	it('accepts data + column with alt text from either source', () => {
		expect(run({ data: 'products', column: 'image_url', description_column: 'name' })).toEqual([]);
		expect(run({ data: 'products', column: 'image_url', description: 'Product' })).toEqual([]);
	});

	it('requires column when data is provided', () => {
		expect(messages({ data: 'products', description: 'Product' })).toEqual([
			'column: Required when data is provided'
		]);
	});

	it('requires alt text from description or description_column', () => {
		expect(messages({ data: 'products', column: 'image_url' })).toEqual([
			'description: Provide description or description_column for the image alt text'
		]);
	});

	it('treats an empty data string as static mode, matching the model', () => {
		expect(messages({ data: '', column: 'image_url' })).toEqual([
			'url: Required unless data is provided',
			'description: Required',
			'column: Requires data'
		]);
	});

	it('rejects static urls alongside data', () => {
		const attrs = { data: 'products', column: 'image_url', description: 'Product' };
		expect(messages({ ...attrs, url: 'https://a.com/x.png' })).toEqual([
			'url: Cannot be combined with data — use column to load the URL'
		]);
		expect(messages({ ...attrs, dark_url: 'https://a.com/dark.png' })).toEqual([
			'dark_url: Cannot be combined with data — use dark_column instead'
		]);
	});
});
