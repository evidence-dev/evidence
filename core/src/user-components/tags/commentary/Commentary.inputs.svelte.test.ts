// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount, type ComponentProps } from 'svelte';
import { Filters } from '../../../Filters.svelte';
import { PAGE_FILTERS_CONTEXT_KEY } from '../../../page-filters-context';
import { setPageState } from '../../../shims/page-state';
import Markdoc from '@markdoc/markdoc';
import { registerFiltersFromAST } from '../../Renderer/MarkdocProcessor/register-filters';
import { PeriodFilter } from '../workflow_period/PeriodFilter.svelte';
import type Commentary from './Commentary.svelte';
import CommentaryTestHarness from './CommentaryTestHarness.svelte';
import { PageRenderTracker } from '../../../page-render-tracker.context.svelte';

vi.mock('svelte/transition', async (importOriginal) => ({
	...(await importOriginal<typeof import('svelte/transition')>()),
	fade: () => ({ duration: 0 })
}));

vi.mock('../../../shims/auth', () => ({
	getAuthContext: () => ({
		getUser: () => ({
			id: 'Taylor',
			firstName: 'Taylor',
			lastName: null,
			email: 'taylor@example.com',
			profilePictureUrl: null
		})
	})
}));

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

beforeEach(() => {
	vi.useFakeTimers();
	setPageState({
		data: { project: { id: 1 }, page: { id: 'file-id' } },
		route: { id: '/(published)/[organizationId]/[projectSlug]/[...path]' }
	});
});

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function comment(text: string | null) {
	return {
		text,
		createdAt: '2026-08-01T12:00:00Z',
		history: [
			{
				text,
				createdAt: '2026-08-01T12:00:00Z',
				user: { id: 'Alex', name: 'Alex', avatarUrl: null }
			}
		]
	};
}

/** Stores commentary under the same identity the API keys on: period key + input values. */
function server(initial: Record<string, ReturnType<typeof comment>> = {}) {
	const stored = new Map(Object.entries(initial));
	const keyOf = (request: Record<string, string>) =>
		`${request.periodKey ?? '-'}|${request.inputs ?? '-'}`;
	const fetch = vi.fn(async (input: string, init?: RequestInit) => {
		const url = new URL(input, 'https://example.com');
		const request =
			init?.method === 'POST'
				? JSON.parse(String(init.body))
				: Object.fromEntries(url.searchParams);
		if (init?.method === 'POST') {
			stored.set(keyOf(request), comment(request.text));
			return { ok: true, json: async () => ({ success: true, comment: comment(request.text) }) };
		}
		return {
			ok: true,
			json: async () => ({ success: true, comment: stored.get(keyOf(request)) ?? null })
		};
	});
	vi.stubGlobal('fetch', fetch);
	return { fetch, stored };
}

function makeFilters(body = '{% dropdown id="fund" data="funds" value_column="fund" /%}') {
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: { computedDefaultDateRangeEnd: '2026-08-14' } as never,
		dialect: undefined
	});
	registerFiltersFromAST(
		Markdoc.parse(`---\nworkflow:\n  period:\n    grain: month\n---\n\n${body}\n`),
		filters
	);
	return filters;
}

function mountCommentary(
	filters: Filters,
	scope: ComponentProps<typeof Commentary>['scope'],
	renderTracker?: PageRenderTracker
) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(CommentaryTestHarness, {
		target,
		props: {
			props: { id: 'notes', scope, style: 'normal', hideEditMetadata: 'print' },
			renderTracker
		},
		context: new Map([[PAGE_FILTERS_CONTEXT_KEY, filters]])
	});
	flushSync();
}

async function settle() {
	flushSync();
	await vi.advanceTimersByTimeAsync(100);
	await tick();
	flushSync();
}

function lastRequest(fetch: ReturnType<typeof server>['fetch']) {
	const [input, init] = fetch.mock.calls.at(-1)!;
	return init?.method === 'POST'
		? JSON.parse(String(init.body))
		: Object.fromEntries(new URL(input, 'https://example.com').searchParams);
}

function prose() {
	return target.querySelector('.prose')?.textContent;
}

describe('Commentary scoped to inputs', () => {
	it('keeps separate commentary per period and fund', async () => {
		const { fetch } = server({
			'2026-07|{"fund":"A"}': comment('July, fund A'),
			'2026-07|{"fund":"B"}': comment('July, fund B'),
			'2026-06|{"fund":"A"}': comment('June, fund A')
		});
		const filters = makeFilters();
		filters.get('fund')!.value = 'A';
		mountCommentary(filters, ['period', 'fund']);
		await settle();
		expect(prose()).toBe('July, fund A');
		expect(lastRequest(fetch)).toMatchObject({
			scope: 'period',
			periodKey: '2026-07',
			inputs: '{"fund":"A"}'
		});

		filters.get('fund')!.value = 'B';
		await settle();
		expect(prose()).toBe('July, fund B');

		filters.get('fund')!.value = 'A';
		(filters.get('period') as PeriodFilter).value = { key: '2026-06' };
		await settle();
		expect(prose()).toBe('June, fund A');
	});

	it('shares the period-only bucket while no fund is selected', async () => {
		const { fetch } = server({ '2026-07|-': comment('Saved before fund was in scope') });
		mountCommentary(makeFilters(), ['period', 'fund']);
		await settle();
		expect(prose()).toBe('Saved before fund was in scope');
		expect(lastRequest(fetch)).not.toHaveProperty('inputs');
	});

	it('saves to the selected fund only', async () => {
		const { fetch, stored } = server();
		const filters = makeFilters();
		filters.get('fund')!.value = 'A';
		mountCommentary(filters, 'fund');
		await settle();
		target.querySelector('button')!.click();
		flushSync();
		const editor = target.querySelector<HTMLElement>('[contenteditable]')!;
		editor.innerHTML = 'Fund A note';
		editor.dispatchEvent(new Event('input', { bubbles: true }));
		flushSync();
		Array.from(target.querySelectorAll('button'))
			.find((b) => b.textContent?.trim() === 'Save')!
			.click();
		await settle();
		expect(lastRequest(fetch)).toEqual({
			text: 'Fund A note',
			projectId: 1,
			fileId: 'file-id',
			scope: 'page',
			inputs: '{"fund":"A"}'
		});
		expect([...stored.keys()]).toEqual(['-|{"fund":"A"}']);
	});

	it('keys an independent period picker on its resolved period, even before one is picked', async () => {
		const { fetch } = server();
		mountCommentary(
			makeFilters(
				'{% dropdown id="fund" data="funds" value_column="fund" /%}\n{% period_selector id="quarter" grain="quarter" /%}'
			),
			['quarter', 'fund']
		);
		await settle();
		expect(lastRequest(fetch).inputs).toBe('{"quarter":"2026-Q2"}');
	});

	it.each([
		['a missing input', ['period', 'nope'], undefined, 'does not exist'],
		[
			'a multi-select input',
			['fund'],
			'{% dropdown id="fund" data="funds" value_column="fund" multiple=true /%}',
			'multiple selections'
		],
		['an unsupported input', ['dates'], '{% range_calendar id="dates" /%}', "can't be used"]
	])('shows an error for %s and never fetches', async (_, scope, body, message) => {
		const { fetch } = server();
		mountCommentary(makeFilters(body), scope);
		await settle();
		expect(target.querySelector('[role="alert"]')?.textContent).toContain(message);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('holds a PDF render open while a late input default reloads the commentary', async () => {
		server({ '-|{"fund":"A"}': comment('Fund A note') });
		const filters = makeFilters();
		const tracker = new PageRenderTracker();
		mountCommentary(filters, 'fund', tracker);
		await settle();
		// The unselected bucket has loaded, so nothing is pending yet.
		expect(tracker.pendingCount).toBe(0);

		// A select_first-style default arrives after the first load.
		filters.get('fund')!.setDefault('A');
		flushSync();
		expect(tracker.pendingCount).toBe(1);
		await settle();
		expect(tracker.pendingCount).toBe(0);
		expect(prose()).toBe('Fund A note');
	});
});
