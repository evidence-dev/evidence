import { describe, test, expect } from 'vitest';
import { dirOfPath, resolveProjectReference } from './resolve-reference';

describe('dirOfPath', () => {
	test('returns the directory of a nested path', () => {
		expect(dirOfPath('pages/reports/q4')).toBe('pages/reports');
	});

	test('returns the single parent for a one-level path', () => {
		expect(dirOfPath('pages/home')).toBe('pages');
	});

	test('returns empty string for a root-level path', () => {
		expect(dirOfPath('home')).toBe('');
	});

	test('ignores leading slashes', () => {
		expect(dirOfPath('/pages/home')).toBe('pages');
	});
});

describe('resolveProjectReference', () => {
	describe('leading slash = from project root', () => {
		test('strips the leading slash', () => {
			expect(resolveProjectReference('/queries/orders', 'pages/reports')).toBe('queries/orders');
		});

		test('base dir is irrelevant for root refs', () => {
			expect(resolveProjectReference('/pages/home', 'anything/here')).toBe('pages/home');
		});

		test('collapses repeated leading slashes', () => {
			expect(resolveProjectReference('//queries/orders', '')).toBe('queries/orders');
		});
	});

	describe('no slash = from here (relative to the referencing file dir)', () => {
		test('resolves a sibling', () => {
			expect(resolveProjectReference('new-query', 'pages')).toBe('pages/new-query');
		});

		test('resolves a sibling in a nested page dir', () => {
			expect(resolveProjectReference('orders', 'pages/reports')).toBe('pages/reports/orders');
		});

		test('resolves a multi-segment relative ref', () => {
			expect(resolveProjectReference('sub/x', 'pages')).toBe('pages/sub/x');
		});

		test('empty base dir returns the ref as-is', () => {
			expect(resolveProjectReference('orders', '')).toBe('orders');
		});

		test('does NOT special-case ./ or ../ (treated as literal segments)', () => {
			// We intentionally do not implement dot traversal.
			expect(resolveProjectReference('./x', 'pages')).toBe('pages/./x');
		});
	});
});
