// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import HtmlLoadingShellTestHarness from './HtmlLoadingShellTestHarness.svelte';
import {
	INLINE_HTML_LOADING_FALLBACK_MS,
	MODAL_HTML_LOADING_FALLBACK_MS
} from './html-loading';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	if (mounted) {
		unmount(mounted);
		mounted = undefined;
	}
	target?.remove();
	target = undefined;
	vi.useRealTimers();
});

function render(fallbackMs: number) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(HtmlLoadingShellTestHarness, { target, props: { fallbackMs } });
	flushSync();
	return target;
}

describe('html-loading fallbacks', () => {
	it('keeps the modal fallback short and the inline fallback long enough for warehouse queries', () => {
		expect(MODAL_HTML_LOADING_FALLBACK_MS).toBe(600);
		expect(INLINE_HTML_LOADING_FALLBACK_MS).toBe(20_000);
		expect(INLINE_HTML_LOADING_FALLBACK_MS).toBeGreaterThan(MODAL_HTML_LOADING_FALLBACK_MS);
	});
});

describe('HtmlLoadingShell', () => {
	it('shows Loading… until onRendered', () => {
		const root = render(5_000);
		expect(root.textContent).toContain('Loading…');

		root.querySelector<HTMLButtonElement>('[data-testid="mark-ready"]')?.click();
		flushSync();

		expect(root.textContent).not.toContain('Loading…');
		expect(root.textContent).toContain('content');
	});

	it('reveals content when the fallback timer fires', () => {
		const root = render(600);
		expect(root.textContent).toContain('Loading…');

		vi.advanceTimersByTime(599);
		flushSync();
		expect(root.textContent).toContain('Loading…');

		vi.advanceTimersByTime(1);
		flushSync();
		expect(root.textContent).not.toContain('Loading…');
	});

	it('returns to Loading… when resetKey changes', () => {
		const root = render(5_000);
		root.querySelector<HTMLButtonElement>('[data-testid="mark-ready"]')?.click();
		flushSync();
		expect(root.textContent).not.toContain('Loading…');

		root.querySelector<HTMLButtonElement>('[data-testid="bump-reset"]')?.click();
		flushSync();
		expect(root.textContent).toContain('Loading…');
	});
});
