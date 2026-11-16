import { describe, expect, it } from 'vitest';
import { basemapLabelExpression } from './map.action';

describe('basemapLabelExpression', () => {
	it('keeps the English-first label for English and unset languages', () => {
		const english = ['coalesce', ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];
		expect(basemapLabelExpression(undefined)).toEqual(english);
		expect(basemapLabelExpression('en')).toEqual(english);
	});

	it('prefers the page language, then falls back to English and the local name', () => {
		expect(basemapLabelExpression('fr')).toEqual([
			'coalesce',
			['get', 'name:fr'],
			['get', 'name_en'],
			['get', 'name:latin'],
			['get', 'name']
		]);
	});
});
