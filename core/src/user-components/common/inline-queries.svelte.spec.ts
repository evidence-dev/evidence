// `.svelte.spec.ts` because `SvelteMap` (imported from `svelte/reactivity`) is
// a Svelte-aware module. The tests themselves are pure unit tests — we spy on
// `SvelteMap.prototype.set` / `.delete` to count actual reactive writes
// rather than driving the effect system, which would otherwise require
// Svelte's browser build to be resolved in vitest.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import { InlineQueries } from './inline-queries';

// SvelteMap.set() / .delete() notify subscribers UNCONDITIONALLY — even when
// the value is identical or the key is absent. In production this combined
// with two amplifiers:
//   1. Markdoc's editor transform runs N times per page load and rewrites
//      every inline query each pass, so set()-with-same-value happens at
//      every transform.
//   2. loadAllDebounced re-pushes every project SQL file on every filter
//      change, so setSqlFiles()-with-same-payload happens on every dropdown
//      tick.
// Each spurious write fanned out to every reactive that reads from inline
// queries (Query derivations, dropdown options, validators, table metadata).
// On heavy editor pages the resulting microtask traffic was enough to
// visually freeze the preview AND starve user-input dispatch (buttons /
// navigation became unresponsive while the page itself stayed painted).
//
// These tests assert each mutator skips the underlying SvelteMap write when
// the value is unchanged. Counting writes on the prototype is a more
// portable check than counting effect re-runs, which require Svelte's
// browser build — not available in this package's default `node`
// vitest environment.

let setSpy: ReturnType<typeof vi.spyOn>;
let deleteSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	setSpy = vi.spyOn(SvelteMap.prototype, 'set');
	deleteSpy = vi.spyOn(SvelteMap.prototype, 'delete');
});

afterEach(() => {
	setSpy.mockRestore();
	deleteSpy.mockRestore();
});

describe('InlineQueries reactivity: mutators are no-ops when the value is unchanged', () => {
	test('set(name, sameValue) does not call SvelteMap.set', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.set('q', 'SELECT 1');
		const baselineSets = setSpy.mock.calls.length;

		iq.set('q', 'SELECT 1');
		iq.set('q', 'SELECT 1;');
		iq.set('q', 'SELECT 1;\n');
		iq.set('q', 'SELECT 1;\t  ');
		expect(setSpy.mock.calls.length).toBe(baselineSets);

		iq.set('q', 'SELECT 2');
		expect(setSpy.mock.calls.length).toBe(baselineSets + 1);
		expect(iq.getRaw('q')).toBe('SELECT 2');
	});

	test('remove(name) for an absent key does not call SvelteMap.delete', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		const baselineDeletes = deleteSpy.mock.calls.length;

		iq.remove('q');
		iq.remove('q');
		expect(deleteSpy.mock.calls.length).toBe(baselineDeletes);

		iq.set('q', 'SELECT 1');
		iq.remove('q');
		expect(deleteSpy.mock.calls.length).toBe(baselineDeletes + 1);
		expect(iq.getRaw('q')).toBeUndefined();
	});

	test('setSqlFile(path, sameValue) does not call SvelteMap.set', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.setSqlFile('orders', 'SELECT 1');
		const baselineSets = setSpy.mock.calls.length;

		iq.setSqlFile('orders', 'SELECT 1');
		iq.setSqlFile('orders', 'SELECT 1;');
		expect(setSpy.mock.calls.length).toBe(baselineSets);

		iq.setSqlFile('orders', 'SELECT 2');
		expect(setSpy.mock.calls.length).toBe(baselineSets + 1);
		expect(iq.getRaw('orders')).toBe('SELECT 2');
	});

	test('setSqlFiles({}) only writes entries that actually changed', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.setSqlFiles({ orders: 'SELECT 1', users: 'SELECT 2' });
		const setsAfterInit = setSpy.mock.calls.length;
		const deletesAfterInit = deleteSpy.mock.calls.length;

		// Payload equivalent after `stripTrailingSemicolons` normalization
		// (the trailing `;` on `users` is stripped before comparison): zero
		// writes, zero deletes.
		iq.setSqlFiles({ orders: 'SELECT 1', users: 'SELECT 2;' });
		expect(setSpy.mock.calls.length).toBe(setsAfterInit);
		expect(deleteSpy.mock.calls.length).toBe(deletesAfterInit);

		// One entry changes: exactly one write, no deletes.
		iq.setSqlFiles({ orders: 'SELECT 1', users: 'SELECT 99' });
		expect(setSpy.mock.calls.length).toBe(setsAfterInit + 1);
		expect(deleteSpy.mock.calls.length).toBe(deletesAfterInit);

		// One entry dropped: one delete, no writes.
		iq.setSqlFiles({ orders: 'SELECT 1' });
		expect(setSpy.mock.calls.length).toBe(setsAfterInit + 1);
		expect(deleteSpy.mock.calls.length).toBe(deletesAfterInit + 1);
		expect(iq.getRaw('users')).toBeUndefined();
		expect(iq.getRaw('orders')).toBe('SELECT 1');
	});

	test('setProjectSqlFiles({}) only writes entries that actually changed', () => {
		const iq = new InlineQueries({ filterContexts: undefined });
		iq.setProjectSqlFiles({ 'queries/orders': 'SELECT 1' });
		const baselineSets = setSpy.mock.calls.length;

		iq.setProjectSqlFiles({ 'queries/orders': 'SELECT 1' });
		iq.setProjectSqlFiles({ 'queries/orders': 'SELECT 1;' });
		expect(setSpy.mock.calls.length).toBe(baselineSets);

		iq.setProjectSqlFiles({ 'queries/orders': 'SELECT 2' });
		expect(setSpy.mock.calls.length).toBe(baselineSets + 1);
		expect(iq.getRaw('/queries/orders')).toBe('SELECT 2');
	});

	test('setBasePath(samePath) does not call SvelteMap.set', () => {
		const iq = new InlineQueries(
			{ filterContexts: undefined },
			undefined,
			{ 'pages/home/orders': 'SELECT 1' },
			undefined,
			{ basePath: 'pages/home', useRelativeResolution: true }
		);
		const baselineSets = setSpy.mock.calls.length;

		iq.setBasePath('pages/home');
		expect(setSpy.mock.calls.length).toBe(baselineSets);

		iq.setBasePath('pages/other');
		expect(setSpy.mock.calls.length).toBe(baselineSets + 1);
	});

	test('setUseRelativeResolution(sameMode) does not call SvelteMap.set', () => {
		const iq = new InlineQueries(
			{ filterContexts: undefined },
			undefined,
			{ 'pages/home/orders': 'SELECT 1' },
			undefined,
			{ basePath: 'pages/home', useRelativeResolution: true }
		);
		const baselineSets = setSpy.mock.calls.length;

		iq.setUseRelativeResolution(true);
		expect(setSpy.mock.calls.length).toBe(baselineSets);

		iq.setUseRelativeResolution(false);
		expect(setSpy.mock.calls.length).toBe(baselineSets + 1);
	});
});
