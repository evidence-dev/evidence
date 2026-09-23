// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount, type ComponentProps } from 'svelte';
import { Filters } from '../../../Filters.svelte';
import { PAGE_FILTERS_CONTEXT_KEY } from '../../../page-filters-context';
import { setPageState } from '../../../shims/page-state';
import { PeriodFilter } from '../workflow_period/PeriodFilter.svelte';
import type Commentary from './Commentary.svelte';
import CommentaryTestHarness from './CommentaryTestHarness.svelte';

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

function comment(text: string | null, name = 'Alex') {
	return {
		text,
		createdAt: '2026-08-01T12:00:00Z',
		history: [
			{
				text,
				createdAt: '2026-08-01T12:00:00Z',
				user: { id: name, name, avatarUrl: null }
			}
		]
	};
}

function response(
	value: ReturnType<typeof comment> | Omit<ReturnType<typeof comment>, 'history'> | null
) {
	return { ok: true, json: async () => ({ success: true, comment: value }) };
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => (resolve = done));
	return { promise, resolve };
}

function server(initial: Record<string, ReturnType<typeof comment>> = {}) {
	const stored = new Map(Object.entries(initial));
	const fetch = vi.fn(async (input: string, init?: RequestInit) => {
		const url = new URL(input, 'https://example.com');
		const request =
			init?.method === 'POST'
				? JSON.parse(String(init.body))
				: Object.fromEntries(url.searchParams);
		const key = request.scope === 'period' ? request.periodKey : 'page';
		if (init?.method === 'POST') {
			const saved = comment(request.text, 'Taylor');
			stored.set(key, saved);
			return response({ text: saved.text, createdAt: saved.createdAt });
		}
		return response(stored.get(key) ?? null);
	});
	vi.stubGlobal('fetch', fetch);
	return { fetch, stored };
}

function makeFilters(withPeriod = true) {
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: { computedDefaultDateRangeEnd: '2026-08-14' } as never,
		dialect: undefined
	});
	if (withPeriod) {
		filters.create(
			{
				id: 'period',
				userComponentName: 'workflow_period',
				attributes: { id: 'period', grain: 'month', periods: 3 }
			},
			PeriodFilter
		);
	}
	return filters;
}

function mountCommentary(
	filters: Filters | undefined = makeFilters(),
	props: ComponentProps<typeof Commentary> = {
		id: 'comment-id',
		scope: 'period',
		style: 'normal',
		hideEditMetadata: 'print'
	}
) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(CommentaryTestHarness, {
		target,
		props: { props },
		context: new Map([[PAGE_FILTERS_CONTEXT_KEY, filters]])
	});
	flushSync();
	return filters;
}

async function settle() {
	flushSync();
	await vi.advanceTimersByTimeAsync(100);
	await tick();
	flushSync();
}

async function selectPeriod(filters: Filters, key: string) {
	(filters.get('period') as PeriodFilter).value = { key };
	await settle();
}

function button(label: string) {
	const found = Array.from(target.querySelectorAll('button')).find(
		(element) => element.textContent?.trim() === label
	);
	if (!found) throw new Error(`Missing button: ${label}`);
	return found;
}

function edit(html: string) {
	const editor = target.querySelector<HTMLElement>('[contenteditable]');
	if (!editor) throw new Error('Missing commentary editor');
	editor.innerHTML = html;
	editor.dispatchEvent(new Event('input', { bubbles: true }));
	flushSync();
}

function beginEdit(html: string) {
	button(target.querySelector('.prose') ? 'Edit' : 'Add a comment...').click();
	flushSync();
	edit(html);
}

describe('Commentary period scope', () => {
	it('loads and saves independent periods, clearing text and history for an empty period', async () => {
		const { stored } = server({ '2026-07': comment('July review', 'July editor') });
		const filters = mountCommentary()!;
		await settle();
		expect(target.textContent).toContain('July review');
		expect(target.textContent).toContain('Edited');
		expect(target.querySelectorAll('[data-slot="avatar"]').length).toBe(1);

		await selectPeriod(filters, '2026-06');
		expect(target.querySelector('.prose')).toBeNull();
		expect(target.textContent).not.toContain('Edited');
		expect(target.querySelectorAll('[data-slot="avatar"]').length).toBe(0);
		beginEdit('June review');
		button('Save').click();
		await settle();
		expect(stored.get('2026-06')?.text).toBe('June review');
		expect(stored.get('2026-07')?.text).toBe('July review');
		await selectPeriod(filters, '2026-07');
		expect(target.querySelector('.prose')?.textContent).toBe('July review');
		await selectPeriod(filters, '2026-06');
		expect(target.querySelector('.prose')?.textContent).toBe('June review');
	});

	it('defaults to a page bucket that does not follow period changes', async () => {
		const { fetch, stored } = server({ page: comment('Page review') });
		const filters = mountCommentary(makeFilters(), {
			id: 'comment/id &',
			style: 'normal',
			hideEditMetadata: 'print'
		})!;
		await settle();
		const url = new URL(fetch.mock.calls[0][0], 'https://example.com');
		expect(url.pathname).toBe('/comments/comment%2Fid%20%26');
		expect(Object.fromEntries(url.searchParams)).toEqual({
			projectId: '1',
			fileId: 'file-id',
			scope: 'page'
		});
		await selectPeriod(filters, '2026-06');
		expect(target.querySelector('.prose')?.textContent).toBe('Page review');
		expect(fetch).toHaveBeenCalledTimes(1);
		beginEdit('Updated page review');
		button('Save').click();
		await settle();
		expect(stored.get('page')?.text).toBe('Updated page review');
		expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({
			text: 'Updated page review',
			projectId: 1,
			fileId: 'file-id',
			scope: 'page'
		});
	});

	it('keeps existing editors and adds the saving author when POST omits history', async () => {
		server({ '2026-07': comment('July review') });
		mountCommentary();
		await settle();
		beginEdit('Updated review');
		button('Save').click();
		await settle();
		expect(target.querySelector('.prose')?.textContent).toBe('Updated review');
		expect(
			Array.from(target.querySelectorAll('[data-slot="avatar"]')).map((avatar) =>
				avatar.textContent?.trim()
			)
		).toEqual(['A', 'T']);
		beginEdit('Updated again');
		button('Save').click();
		await settle();
		expect(target.querySelectorAll('[data-slot="avatar"]').length).toBe(2);
	});

	it('resets a previously loaded clean bucket when its next response is empty', async () => {
		const { stored } = server({ '2026-07': comment('July review') });
		const filters = mountCommentary()!;
		await settle();
		await selectPeriod(filters, '2026-06');
		stored.delete('2026-07');
		await selectPeriod(filters, '2026-07');
		expect(target.querySelector('.prose, [data-slot="avatar"]')).toBeNull();
		expect(target.textContent).not.toContain('Edited');
	});

	it.each(['missing', 'different filter'])(
		'shows a configuration error with a %s period and never reads or writes a page bucket',
		async (kind) => {
			const { fetch } = server({ page: comment('Must not appear') });
			const filters = makeFilters(false);
			if (kind === 'different filter') filters.createExternal('period', '2026-07');
			mountCommentary(filters, {
				id: 'comment-id',
				scope: 'period',
				style: 'normal',
				hideEditMetadata: 'always'
			});
			await settle();
			expect(target.querySelector('[role="alert"]')?.textContent).toContain('workflow.period');
			expect(target.querySelector('button, [contenteditable]')).toBeNull();
			expect(target.textContent).not.toContain('Must not appear');
			expect(fetch).not.toHaveBeenCalled();
		}
	);

	it('ignores an aborted fetch even if it resolves after the newly selected period', async () => {
		const { fetch } = server({ '2026-06': comment('June review') });
		const pending = deferred<ReturnType<typeof response>>();
		fetch.mockImplementationOnce(() => pending.promise);
		const filters = mountCommentary()!;
		await settle();
		const signal = fetch.mock.calls[0][1]?.signal;
		await selectPeriod(filters, '2026-06');
		expect(signal?.aborted).toBe(true);
		expect(target.querySelector('.prose')?.textContent).toBe('June review');
		pending.resolve(response(comment('Stale July')));
		await settle();
		expect(target.querySelector('.prose')?.textContent).toBe('June review');
		expect(target.querySelector('[role="alert"]')).toBeNull();
	});

	it('debounces fast period changes without fetching intermediate buckets', async () => {
		const { fetch } = server({ '2026-05': comment('May review') });
		const filters = mountCommentary()!;
		(filters.get('period') as PeriodFilter).value = { key: '2026-06' };
		flushSync();
		(filters.get('period') as PeriodFilter).value = { key: '2026-05' };
		await settle();
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(
			new URL(fetch.mock.calls[0][0], 'https://example.com').searchParams.get('periodKey')
		).toBe('2026-05');
		expect(target.querySelector('.prose')?.textContent).toBe('May review');
	});

	it('keeps an in-flight save on its original period without changing the selected period', async () => {
		const { fetch, stored } = server({
			'2026-07': comment('July review'),
			'2026-06': comment('June review')
		});
		const filters = mountCommentary()!;
		await settle();
		beginEdit('Saved July');
		const pending = deferred<void>();
		const respond = fetch.getMockImplementation()!;
		fetch.mockImplementationOnce(async (...args) => {
			const result = await respond(...args);
			await pending.promise;
			return result;
		});
		button('Save').click();
		await selectPeriod(filters, '2026-06');
		beginEdit('Unsaved June');
		pending.resolve();
		await settle();
		expect(target.querySelector('[contenteditable]')?.innerHTML).toBe('Unsaved June');
		expect(stored.get('2026-06')?.text).toBe('June review');
		expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({
			text: 'Saved July',
			projectId: 1,
			fileId: 'file-id',
			scope: 'period',
			periodGrain: 'month',
			periodKey: '2026-07'
		});
		await selectPeriod(filters, '2026-07');
		expect(target.querySelector('.prose')?.textContent).toBe('Saved July');
	});

	it('does not let a refetch that predates a successful save restore the old value', async () => {
		const { fetch } = server({ '2026-07': comment('July review') });
		const filters = mountCommentary()!;
		await settle();
		beginEdit('Saved July');
		await selectPeriod(filters, '2026-06');
		const pending = deferred<ReturnType<typeof response>>();
		fetch.mockImplementationOnce(() => pending.promise);
		await selectPeriod(filters, '2026-07');
		button('Save').click();
		await settle();
		pending.resolve(response(comment('July review')));
		await settle();
		expect(target.querySelector('.prose')?.textContent).toBe('Saved July');
	});

	it('restores unsaved drafts in multiple periods and keeps Cancel tied to saved content', async () => {
		server({ '2026-07': comment('July review'), '2026-06': comment('June review') });
		const filters = mountCommentary()!;
		await settle();
		beginEdit('<strong>July draft</strong>');
		await selectPeriod(filters, '2026-06');
		beginEdit('June draft');
		await selectPeriod(filters, '2026-07');
		expect(target.querySelector('[contenteditable]')?.innerHTML).toBe(
			'<strong>July draft</strong>'
		);
		button('Cancel').click();
		flushSync();
		expect(target.querySelector('.prose')?.textContent).toBe('July review');
		await selectPeriod(filters, '2026-06');
		expect(target.querySelector('[contenteditable]')?.innerHTML).toBe('June draft');
	});

	it('retains a failed save and its error across period switches, then retries the draft', async () => {
		const { fetch, stored } = server({ '2026-07': comment('July review') });
		const filters = mountCommentary()!;
		await settle();
		beginEdit('Retry this draft');
		fetch.mockRejectedValueOnce(new Error('Connection lost'));
		button('Save').click();
		await settle();
		expect(target.querySelector('[role="alert"]')?.textContent).toBe('Connection lost');
		expect(target.querySelector('[contenteditable]')?.innerHTML).toBe('Retry this draft');
		await selectPeriod(filters, '2026-06');
		expect(target.querySelector('[role="alert"]')).toBeNull();
		await selectPeriod(filters, '2026-07');
		expect(target.querySelector('[role="alert"]')?.textContent).toBe('Connection lost');
		expect(target.querySelector('[contenteditable]')?.innerHTML).toBe('Retry this draft');
		button('Save').click();
		await settle();
		expect(stored.get('2026-07')?.text).toBe('Retry this draft');
		expect(target.querySelector('[role="alert"]')).toBeNull();
	});

	it('keeps a delayed save error and draft in the original period', async () => {
		const { fetch } = server({
			'2026-07': comment('July review'),
			'2026-06': comment('June review')
		});
		const filters = mountCommentary()!;
		await settle();
		beginEdit('July draft');
		const pending = deferred<ReturnType<typeof response>>();
		fetch.mockImplementationOnce(() => pending.promise);
		button('Save').click();
		await selectPeriod(filters, '2026-06');
		pending.resolve({
			ok: false,
			json: async () => ({ success: false, comment: null, error: 'Access denied' })
		});
		await settle();
		expect(target.querySelector('.prose')?.textContent).toBe('June review');
		expect(target.querySelector('[role="alert"]')).toBeNull();
		await selectPeriod(filters, '2026-07');
		expect(target.querySelector('[role="alert"]')?.textContent).toBe('Access denied');
		expect(target.querySelector('[contenteditable]')?.innerHTML).toBe('July draft');
	});

	it('sends sanitized HTML and allows an existing comment to be cleared', async () => {
		const { stored } = server({ '2026-07': comment('July review') });
		mountCommentary();
		await settle();
		beginEdit('<strong>Safe</strong><img src="x" onerror="alert(1)"><script>alert(1)</script>');
		button('Save').click();
		await settle();
		expect(stored.get('2026-07')?.text).toBe('<strong>Safe</strong><img src="x">');
		expect(target.querySelector('[onerror], script')).toBeNull();
		beginEdit('<br>');
		expect(button('Save')).toBeTruthy();
		button('Save').click();
		await settle();
		expect(stored.get('2026-07')?.text).toBeNull();
		expect(target.querySelector('.prose')).toBeNull();
		expect(button('Add a comment...')).toBeTruthy();
	});

	it.each(['/(pdf)/report', '/(app)/project/path/edit'])(
		'loads the selected period without write controls on %s',
		async (route) => {
			const { fetch } = server({ '2026-06': comment('June review') });
			setPageState({ route: { id: route } });
			const filters = makeFilters();
			(filters.get('period') as PeriodFilter).value = { key: '2026-06' };
			mountCommentary(filters);
			await settle();
			expect(target.querySelector('.prose')?.textContent).toBe('June review');
			expect(target.querySelector('[contenteditable]')).toBeNull();
			expect(
				Array.from(target.querySelectorAll('button')).map((el) => el.textContent)
			).not.toContain('Edit');
			await selectPeriod(filters, '2026-05');
			expect(target.querySelector('.prose, [contenteditable], button')).toBeNull();
			expect(fetch.mock.calls.every(([, init]) => init?.method !== 'POST')).toBe(true);
		}
	);

	it('refetches when component, file, project, or scope changes', async () => {
		const { fetch } = server({ '2026-07': comment('Period review'), page: comment('Page review') });
		const data = $state({ project: { id: 1 }, page: { id: 'first file' } });
		const props = $state<ComponentProps<typeof Commentary>>({
			id: 'first comment',
			scope: 'period',
			style: 'normal',
			hideEditMetadata: 'print'
		});
		setPageState({ data });
		mountCommentary(makeFilters(), props);
		await settle();
		props.id = 'next/comment';
		await settle();
		expect(fetch.mock.calls.at(-1)?.[0]).toContain('/comments/next%2Fcomment?');
		data.page.id = 'next & file';
		await settle();
		expect(
			new URL(fetch.mock.calls.at(-1)![0], 'https://example.com').searchParams.get('fileId')
		).toBe('next & file');
		data.project.id = 2;
		await settle();
		expect(
			new URL(fetch.mock.calls.at(-1)![0], 'https://example.com').searchParams.get('projectId')
		).toBe('2');
		props.scope = 'page';
		await settle();
		expect(target.querySelector('.prose')?.textContent).toBe('Page review');
		expect(fetch).toHaveBeenCalledTimes(5);
	});
});
