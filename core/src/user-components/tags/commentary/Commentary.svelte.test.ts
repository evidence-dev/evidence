// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { setPageState } from '../../../shims/page-state';
import Commentary from './Commentary.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('Commentary stored text', () => {
	it('renders formatting without executable HTML', async () => {
		vi.useFakeTimers();
		setPageState({
			data: { project: { id: 1 }, page: { id: 'page-id' } },
			route: { id: '/(published)/[organizationId]/[projectSlug]/[...path]' }
		});
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					comment: {
						text: '<strong>Safe</strong><img src="x" onerror="alert(1)"><script>alert(1)</script>',
						createdAt: null,
						history: []
					}
				})
			})
		);

		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(Commentary, {
			target,
			props: { id: 'comment-id', style: 'normal', hideEditMetadata: 'print' }
		});
		flushSync();
		await vi.advanceTimersByTimeAsync(100);
		await tick();
		flushSync();

		expect(target.querySelector('.prose')?.innerHTML.trim()).toBe(
			'<strong>Safe</strong><img src="x">'
		);
		expect(target.querySelector('[onerror], script')).toBeNull();

		const editButton = Array.from(target.querySelectorAll('button')).find(
			(button) => button.textContent === 'Edit'
		);
		editButton?.click();
		flushSync();

		expect(target.querySelector('[contenteditable]')?.innerHTML).toBe(
			'<strong>Safe</strong><img src="x">'
		);
		expect(
			target.querySelector('[contenteditable] [onerror], [contenteditable] script')
		).toBeNull();
	});
});
