import { describe, it, expect, vi } from 'vitest';
import { createEvidenceSdk } from './evidence-sdk';
import type { SandboxHost } from '../../../sandbox/runtime-bootstrap';
import type { HtmlInitMessage } from './html-protocol';

function makeHost(overrides: { post?: SandboxHost['post']; request?: unknown } = {}): SandboxHost {
	return {
		post: overrides.post ?? vi.fn(),
		postLog: vi.fn(),
		// `request` is generic (<T>); a concrete mock can't satisfy that signature
		// structurally, so cast. The test still holds the original vi.fn to assert on.
		request: (overrides.request ?? (async () => ({ rows: [] }))) as SandboxHost['request']
	};
}

const baseInit = (over: Partial<HtmlInitMessage> = {}): HtmlInitMessage => ({
	type: 'init',
	html: '',
	variables: { title: 'Sales' },
	theme: {
		mode: 'light',
		palette: ['#aaa', '#bbb'],
		background: '#ffffff',
		foreground: '#1f2937',
		mutedForeground: '#6b7280',
		border: '#e5e7eb'
	},
	filters: { region: 'EU' },
	printing: false,
	mode: 'autosize',
	...over
});

describe('createEvidenceSdk: query', () => {
	it('asks the host for a named query and returns its rows', async () => {
		const rows = [{ a: 1 }, { a: 2 }];
		const request = vi.fn(async () => ({ rows }));
		const { evidence } = createEvidenceSdk(makeHost({ request }), baseInit());

		const result = await evidence.query('orders');

		expect(request).toHaveBeenCalledWith('query', { name: 'orders' });
		expect(result).toBe(rows);
	});

	it('rejects an empty name with a message that mentions emptiness', async () => {
		const request = vi.fn(async () => ({ rows: [] }));
		const { evidence } = createEvidenceSdk(makeHost({ request }), baseInit());

		await expect(evidence.query('')).rejects.toThrow(/must not be empty/);
		await expect(evidence.query('   ')).rejects.toThrow(/must not be empty/);
		expect(request).not.toHaveBeenCalled();
	});

	it('rejects a non-string name with a message that names the actual type', async () => {
		// Separate from the empty-string case: `query(undefined)` is the
		// common typo/unresolved-variable shape, and the error needs to say
		// so explicitly so the AI agent / author isn't reading a generic
		// "non-empty string" message after passing an obviously-undefined
		// thing.
		const request = vi.fn(async () => ({ rows: [] }));
		const { evidence } = createEvidenceSdk(makeHost({ request }), baseInit());

		const queryAny = evidence.query as (name: unknown) => Promise<unknown>;
		await expect(queryAny(undefined)).rejects.toThrow(/must be a string \(got undefined\)/);
		await expect(queryAny(null)).rejects.toThrow(/must be a string \(got null\)/);
		await expect(queryAny(42)).rejects.toThrow(/must be a string \(got number\)/);
		expect(request).not.toHaveBeenCalled();
	});
});

describe('createEvidenceSdk: variables & theme snapshots', () => {
	it('exposes the init variables and theme', () => {
		const { evidence } = createEvidenceSdk(makeHost(), baseInit());
		expect(evidence.variables).toEqual({ title: 'Sales' });
		expect(evidence.theme).toEqual({ mode: 'light', palette: ['#aaa', '#bbb'] });
	});

	it('returns a defensive copy of the palette (author mutation is harmless)', () => {
		const { evidence } = createEvidenceSdk(makeHost(), baseInit());
		evidence.theme.palette.push('#ccc');
		expect(evidence.theme.palette).toEqual(['#aaa', '#bbb']);
	});

	it('returns a defensive copy of variables (author mutation cannot corrupt SDK state)', () => {
		const { evidence } = createEvidenceSdk(makeHost(), baseInit());
		(evidence.variables as Record<string, unknown>).injected = 'oops';
		delete (evidence.variables as Record<string, unknown>).title;
		expect(evidence.variables).toEqual({ title: 'Sales' });
	});
});

describe('createEvidenceSdk: filters', () => {
	it('get() returns a snapshot; set() posts a filter-set message', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());

		expect(evidence.filters.get()).toEqual({ region: 'EU' });
		evidence.filters.set('region', 'NA');
		expect(post).toHaveBeenCalledWith({ type: 'filter-set', id: 'region', value: 'NA' });
	});

	it('rejects a non-string/empty id before posting (mirrors query)', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());

		expect(() => evidence.filters.set('', 'x')).toThrow(/non-empty string/);
		expect(() => evidence.filters.set('   ', 'x')).toThrow(/non-empty string/);
		expect(() => (evidence.filters.set as (id: unknown, v: unknown) => void)(42, 'x')).toThrow(
			/non-empty string/
		);
		expect(post).not.toHaveBeenCalled();
	});

	it('create() posts a filter-create message distinct from filter-set', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());

		evidence.filters.create('category', 'all');
		expect(post).toHaveBeenCalledWith({ type: 'filter-create', id: 'category', value: 'all' });
	});

	it('create() forwards the optional column binding', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());

		evidence.filters.create('category', 'all', { column: 'product_category' });
		expect(post).toHaveBeenCalledWith({
			type: 'filter-create',
			id: 'category',
			value: 'all',
			column: 'product_category'
		});
	});

	it('create() rejects a non-string/empty id before posting', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());

		expect(() => evidence.filters.create('', 'x')).toThrow(/non-empty string/);
		expect(() => evidence.filters.create('   ', 'x')).toThrow(/non-empty string/);
		expect(() => (evidence.filters.create as (id: unknown, v: unknown) => void)(42, 'x')).toThrow(
			/non-empty string/
		);
		expect(post).not.toHaveBeenCalled();
	});

	it('create() rejects a non-identifier column before posting', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());

		// Each of these would flow into ExternalFilter.sql as a raw interpolation
		// and produce SQL we did not intend to emit. Catch at the SDK boundary so
		// the author gets an explicit error rather than a silently-dropped message.
		const badColumns = [
			"region'; DROP TABLE users; --",
			'region OR 1=1',
			'1region',
			'region.',
			'"My Column"',
			'region/*x*/'
		];
		for (const column of badColumns) {
			expect(() => evidence.filters.create('cat', null, { column })).toThrow(/bare SQL identifier/);
		}
		expect(post).not.toHaveBeenCalled();
	});

	it('create() omits column from the posted message when not supplied', () => {
		// Important so the parent's validator sees the same shape it produced —
		// makes integration tests deterministic and avoids `column: undefined`
		// surviving structured clone in some browsers.
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());

		evidence.filters.create('cat', null);
		expect(post).toHaveBeenCalledWith({ type: 'filter-create', id: 'cat', value: null });
		expect(post.mock.calls[0][0]).not.toHaveProperty('column');
	});
});

describe('createEvidenceSdk: onResize', () => {
	it('fires resize subscribers with the new size and respects unsubscribe', () => {
		const { evidence, notifyResize } = createEvidenceSdk(makeHost(), baseInit());
		const onResize = vi.fn();
		const unsub = evidence.onResize(onResize);

		notifyResize({ width: 640, height: 300 });
		expect(onResize).toHaveBeenCalledTimes(1);
		expect(onResize).toHaveBeenLastCalledWith({ width: 640, height: 300 });

		unsub();
		notifyResize({ width: 480, height: 300 });
		expect(onResize).toHaveBeenCalledTimes(1);
	});
});

describe('createEvidenceSdk: applyState dispatch', () => {
	it('fires subscribe on ANY change, but theme/filter/variable subs only on their own change', () => {
		const { evidence, applyState } = createEvidenceSdk(makeHost(), baseInit());

		const onAny = vi.fn();
		const onTheme = vi.fn();
		const onFilters = vi.fn();
		const onVariables = vi.fn();
		evidence.subscribe(onAny);
		evidence.onThemeChange(onTheme);
		evidence.filters.subscribe(onFilters);
		evidence.onVariablesChange(onVariables);

		// Variables-only change: subscribe + onVariablesChange fire, others don't.
		applyState({
			variables: { title: 'New' },
			theme: {
				mode: 'light',
				palette: ['#aaa', '#bbb'],
				background: '#ffffff',
				foreground: '#1f2937',
				mutedForeground: '#6b7280',
				border: '#e5e7eb'
			},
			filters: { region: 'EU' }
		});
		expect(onAny).toHaveBeenCalledTimes(1);
		expect(onTheme).not.toHaveBeenCalled();
		expect(onFilters).not.toHaveBeenCalled();
		expect(onVariables).toHaveBeenCalledTimes(1);
		expect(onVariables).toHaveBeenLastCalledWith({ title: 'New' });
		expect(evidence.variables).toEqual({ title: 'New' });

		// Theme-only change: subscribe + onThemeChange fire.
		applyState({
			variables: { title: 'New' },
			theme: {
				mode: 'dark',
				palette: ['#111', '#222'],
				background: '#000000',
				foreground: '#f9fafb',
				mutedForeground: '#9ca3af',
				border: '#374151'
			},
			filters: { region: 'EU' }
		});
		expect(onAny).toHaveBeenCalledTimes(2);
		expect(onTheme).toHaveBeenCalledTimes(1);
		expect(onTheme).toHaveBeenLastCalledWith({ mode: 'dark', palette: ['#111', '#222'] });
		expect(onFilters).not.toHaveBeenCalled();
		expect(onVariables).toHaveBeenCalledTimes(1);

		// Filter-only change: subscribe + filters.subscribe fire.
		applyState({
			variables: { title: 'New' },
			theme: {
				mode: 'dark',
				palette: ['#111', '#222'],
				background: '#000000',
				foreground: '#f9fafb',
				mutedForeground: '#9ca3af',
				border: '#374151'
			},
			filters: { region: 'NA' }
		});
		expect(onAny).toHaveBeenCalledTimes(3);
		expect(onTheme).toHaveBeenCalledTimes(1);
		expect(onFilters).toHaveBeenCalledTimes(1);
		expect(onFilters).toHaveBeenLastCalledWith({ region: 'NA' });
		expect(onVariables).toHaveBeenCalledTimes(1);
	});

	it('does NOT fire subscribe when re-applied state is identical (reconnect no-op)', () => {
		// A parent reconnect re-sends the init payload verbatim; nothing moved,
		// so author render callbacks must not be spuriously invoked.
		const init = baseInit();
		const { evidence, applyState } = createEvidenceSdk(makeHost(), init);
		const onAny = vi.fn();
		const onTheme = vi.fn();
		const onFilters = vi.fn();
		const onVariables = vi.fn();
		evidence.subscribe(onAny);
		evidence.onThemeChange(onTheme);
		evidence.filters.subscribe(onFilters);
		evidence.onVariablesChange(onVariables);

		applyState({ variables: init.variables, theme: init.theme, filters: init.filters });

		expect(onAny).not.toHaveBeenCalled();
		expect(onTheme).not.toHaveBeenCalled();
		expect(onFilters).not.toHaveBeenCalled();
		expect(onVariables).not.toHaveBeenCalled();
	});

	it('stops firing a callback after it unsubscribes', () => {
		const { evidence, applyState } = createEvidenceSdk(makeHost(), baseInit());
		const onAny = vi.fn();
		const unsub = evidence.subscribe(onAny);

		applyState({ variables: { x: 1 }, theme: baseInit().theme, filters: {} });
		expect(onAny).toHaveBeenCalledTimes(1);

		unsub();
		applyState({ variables: { x: 2 }, theme: baseInit().theme, filters: {} });
		expect(onAny).toHaveBeenCalledTimes(1);
	});
});

describe('createEvidenceSdk: modal', () => {
	it('open() posts a modal-open message with title and html', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());
		evidence.modal.open({ title: 'Japan', html: '<b>GDP +1.2%</b>' });
		expect(post).toHaveBeenCalledWith({
			type: 'modal-open',
			html: '<b>GDP +1.2%</b>',
			title: 'Japan'
		});
	});

	it('open() omits title when not supplied', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());
		evidence.modal.open({ html: '<p>summary</p>' });
		expect(post).toHaveBeenCalledWith({ type: 'modal-open', html: '<p>summary</p>' });
		expect(post.mock.calls[0][0]).not.toHaveProperty('title');
	});

	it('open() rejects empty/non-string html before posting', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());
		expect(() => evidence.modal.open({ html: '' })).toThrow(/non-empty string/);
		expect(() => evidence.modal.open({ html: '   ' })).toThrow(/non-empty string/);
		expect(() => (evidence.modal.open as (o: unknown) => void)({ html: 42 })).toThrow(
			/non-empty string/
		);
		expect(post).not.toHaveBeenCalled();
	});

	it('close() posts a modal-close message', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());
		evidence.modal.close();
		expect(post).toHaveBeenCalledWith({ type: 'modal-close' });
	});
});

describe('createEvidenceSdk: navigate', () => {
	it('posts a navigate message for a safe internal path', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());
		evidence.navigate('/reports/detail');
		expect(post).toHaveBeenCalledWith({ type: 'navigate', path: '/reports/detail' });
	});

	it('throws (before posting) on an off-origin / unsafe path', () => {
		const post = vi.fn();
		const { evidence } = createEvidenceSdk(makeHost({ post }), baseInit());
		expect(() => evidence.navigate('https://evil.com')).toThrow(/internal app path/);
		expect(() => evidence.navigate('//evil.com')).toThrow(/internal app path/);
		expect(() => evidence.navigate('javascript:alert(1)')).toThrow(/internal app path/);
		expect(() => (evidence.navigate as (p: unknown) => void)('reports')).toThrow(
			/internal app path/
		);
		expect(post).not.toHaveBeenCalled();
	});
});

describe('createEvidenceSdk: reset', () => {
	it('drops every subscription so a re-injected body starts clean', () => {
		const { evidence, applyState, notifyResize, reset } = createEvidenceSdk(makeHost(), baseInit());
		const onAny = vi.fn();
		const onTheme = vi.fn();
		const onFilters = vi.fn();
		const onVariables = vi.fn();
		const onResize = vi.fn();
		evidence.subscribe(onAny);
		evidence.onThemeChange(onTheme);
		evidence.filters.subscribe(onFilters);
		evidence.onVariablesChange(onVariables);
		evidence.onResize(onResize);

		reset();

		applyState({
			variables: { title: 'After' },
			theme: {
				mode: 'dark',
				palette: ['#111'],
				background: '#000000',
				foreground: '#f9fafb',
				mutedForeground: '#9ca3af',
				border: '#374151'
			},
			filters: { region: 'NA' }
		});
		notifyResize({ width: 500, height: 300 });

		expect(onAny).not.toHaveBeenCalled();
		expect(onTheme).not.toHaveBeenCalled();
		expect(onFilters).not.toHaveBeenCalled();
		expect(onVariables).not.toHaveBeenCalled();
		expect(onResize).not.toHaveBeenCalled();
	});
});

describe('createEvidenceSdk: unobserved variables warning', () => {
	it('warns once when variables change with no listener, naming the changed keys', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const init = baseInit();
		init.variables = { speed: 1 };
		const { applyState } = createEvidenceSdk(makeHost(), init);

		applyState({ variables: { speed: 2 }, theme: init.theme, filters: init.filters });
		applyState({ variables: { speed: 3 }, theme: init.theme, filters: init.filters });

		const calls = warn.mock.calls.filter((c) => String(c[0]).includes('evidence.variables'));
		expect(calls).toHaveLength(1);
		expect(String(calls[0][0])).toContain('speed');
		expect(String(calls[0][0])).toContain('onVariablesChange');
		warn.mockRestore();
	});

	it('does not warn when a variables or subscribe listener exists', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const init = baseInit();
		init.variables = { speed: 1 };
		const { evidence, applyState } = createEvidenceSdk(makeHost(), init);
		evidence.onVariablesChange(() => {});

		applyState({ variables: { speed: 2 }, theme: init.theme, filters: init.filters });

		expect(warn.mock.calls.filter((c) => String(c[0]).includes('evidence.variables'))).toHaveLength(
			0
		);
		warn.mockRestore();
	});
});
