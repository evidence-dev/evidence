import { describe, it, expect, vi } from 'vitest';
import { createMapEvidenceSdk } from './map-evidence-sdk';
import type { SandboxHost } from '../../../sandbox/runtime-bootstrap';
import type { InitMessage } from './sandbox-protocol';

function makeHost(): {
	host: SandboxHost;
	posts: Record<string, unknown>[];
	request: ReturnType<typeof vi.fn>;
} {
	const posts: Record<string, unknown>[] = [];
	const request = vi.fn(async () => ({ rows: [{ a: 1 }] }));
	// Cast through unknown: the generic `request<T>` signature can't be satisfied
	// by a concrete mock return type, and we only need runtime behavior here.
	const host = {
		post: (m: Record<string, unknown>) => posts.push(m),
		postLog: () => {},
		request
	} as unknown as SandboxHost;
	return { host, posts, request };
}

const THEME = {
	mode: 'light' as const,
	palette: ['#111'],
	background: '#fff',
	foreground: '#111',
	mutedForeground: '#666',
	border: '#ddd'
};

const INIT: InitMessage = {
	type: 'init',
	userCode: '',
	provider: 'maplibre',
	variables: { region: 'US' },
	theme: THEME,
	filters: { country: 'US' },
	printing: false
};

describe('createMapEvidenceSdk', () => {
	it('query() calls the RPC and returns rows', async () => {
		const { host, request } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		const rows = await sdk.evidence.query('locations');
		expect(request).toHaveBeenCalledWith('query', { name: 'locations' });
		expect(rows).toEqual([{ a: 1 }]);
	});

	it('query() rejects a non-string / empty name before hitting the RPC', async () => {
		const { host } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		await expect(sdk.evidence.query('')).rejects.toThrow();
		// @ts-expect-error deliberately wrong type
		await expect(sdk.evidence.query(5)).rejects.toThrow();
	});

	it('applyState fires only the callbacks whose slice changed', () => {
		const { host } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		const onVars = vi.fn();
		const onTheme = vi.fn();
		const onFilters = vi.fn();
		const onAny = vi.fn();
		sdk.evidence.onVariablesChange(onVars);
		sdk.evidence.onThemeChange(onTheme);
		sdk.evidence.filters.subscribe(onFilters);
		sdk.evidence.subscribe(onAny);

		// Only filters change.
		sdk.applyState({
			variables: { region: 'US' },
			theme: THEME,
			filters: { country: 'FR' }
		});
		expect(onFilters).toHaveBeenCalledTimes(1);
		expect(onVars).not.toHaveBeenCalled();
		expect(onTheme).not.toHaveBeenCalled();
		expect(onAny).toHaveBeenCalledTimes(1);
		expect(sdk.evidence.filters.get()).toEqual({ country: 'FR' });
	});

	it('does not fire subscribers when nothing changed (reconnect no-op)', () => {
		const { host } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		const onAny = vi.fn();
		sdk.evidence.subscribe(onAny);
		sdk.applyState({ variables: { region: 'US' }, theme: INIT.theme, filters: { country: 'US' } });
		expect(onAny).not.toHaveBeenCalled();
	});

	it('filters.set / create post validated messages; bad column throws at the call site', () => {
		const { host, posts } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		sdk.evidence.filters.set('bbox', [1, 2, 3, 4]);
		sdk.evidence.filters.create('region', 'US', { column: 'r.region' });
		expect(posts).toContainEqual({ type: 'filter-set', id: 'bbox', value: [1, 2, 3, 4] });
		expect(posts).toContainEqual({
			type: 'filter-create',
			id: 'region',
			value: 'US',
			column: 'r.region'
		});
		expect(() => sdk.evidence.filters.create('x', 1, { column: 'a; drop' })).toThrow();
		expect(() => sdk.evidence.filters.set('', 1)).toThrow();
	});

	it('runTeardown fires teardown callbacks once, then clears them', () => {
		const { host } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		const teardown = vi.fn();
		sdk.evidence.onTeardown(teardown);
		sdk.runTeardown();
		sdk.runTeardown();
		expect(teardown).toHaveBeenCalledTimes(1);
	});

	it('reset drops subscriptions so a re-render does not double-fire', () => {
		const { host } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		const onAny = vi.fn();
		sdk.evidence.subscribe(onAny);
		sdk.reset();
		sdk.applyState({ variables: {}, theme: INIT.theme, filters: {} });
		expect(onAny).not.toHaveBeenCalled();
	});

	it('notifyResize forwards size to onResize subscribers', () => {
		const { host } = makeHost();
		const sdk = createMapEvidenceSdk(host, INIT);
		const onResize = vi.fn();
		sdk.evidence.onResize(onResize);
		sdk.notifyResize({ width: 800, height: 400 });
		expect(onResize).toHaveBeenCalledWith({ width: 800, height: 400 });
	});
});
