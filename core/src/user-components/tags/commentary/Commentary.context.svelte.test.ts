// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { Filters } from '../../../Filters.svelte';
import { PAGE_FILTERS_CONTEXT_KEY } from '../../../page-filters-context';
import { PeriodFilter } from '../workflow_period/PeriodFilter.svelte';
import { PageRenderTracker } from '../../../page-render-tracker.context.svelte';
import { setPageState } from '../../../shims/page-state';
import Harness from './CommentaryTestHarness.svelte';

let component: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

afterEach(() => {
	if (component) unmount(component);
	target?.remove();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('commentary host context and PDF readiness', () => {
	it('uses reactive host identity and waits for the selected period before capture', async () => {
		vi.useFakeTimers();
		setPageState({ data: { project: { id: 99 }, page: { id: 'wrong-global-file' } } });
		const pageState = $state({
			data: { project: { id: 1 }, page: { id: 'file_pdf' } },
			url: new URL('https://example.com/report?period=2026-06'),
			params: {},
			route: { id: '/(pdf)/report' },
			status: 200,
			error: null,
			form: null
		});
		let finish!: (response: Response) => void;
		const fetch = vi.fn(
			(_url: string) =>
				new Promise<Response>((resolve) => {
					finish = resolve;
				})
		);
		vi.stubGlobal('fetch', fetch);
		const filters = new Filters({
			projectSettings: { computedDefaultDateRangeEnd: '2026-08-14', first_day_of_week: 'sunday' },
			url: undefined,
			updateUrl: undefined,
			dialect: undefined
		});
		const filter = filters.create(
			{
				id: 'period',
				userComponentName: 'workflow_period',
				attributes: { id: 'period', grain: 'month', periods: 12 }
			},
			PeriodFilter
		);
		filter.value = { key: '2026-06' };
		const tracker = new PageRenderTracker();
		target = document.createElement('div');
		document.body.appendChild(target);
		component = mount(Harness, {
			target,
			props: {
				props: { id: 'summary', scope: 'period', style: 'normal', hideEditMetadata: 'print' },
				pageState,
				renderTracker: tracker
			},
			context: new Map([[PAGE_FILTERS_CONTEXT_KEY, filters]])
		});
		flushSync();
		expect(tracker.pendingCount).toBe(1);
		await vi.advanceTimersByTimeAsync(100);
		expect(String(fetch.mock.calls[0]?.[0])).toContain('fileId=file_pdf');
		expect(String(fetch.mock.calls[0]?.[0])).toContain('periodKey=2026-06');
		expect(tracker.isComplete).toBe(false);
		finish(
			Response.json({
				success: true,
				comment: { text: 'June PDF commentary', createdAt: null, history: [] }
			})
		);
		await vi.advanceTimersByTimeAsync(0);
		await tick();
		flushSync();
		expect(target.textContent).toContain('June PDF commentary');
		expect(target.querySelector('button, [contenteditable]')).toBeNull();
		expect(tracker.isComplete).toBe(true);
		pageState.data = { project: { id: 2 }, page: { id: 'file_next' } };
		flushSync();
		await vi.advanceTimersByTimeAsync(100);
		expect(String(fetch.mock.calls.at(-1)?.[0])).toContain('fileId=file_next');
		expect(String(fetch.mock.calls.at(-1)?.[0])).toContain('projectId=2');
	});
});
