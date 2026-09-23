// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import Details from './Details.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
	vi.unstubAllGlobals();
});

function stubViewport(mobile: boolean) {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: mobile && query.includes('max-width'),
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	}));
}

function renderDetails(props: { open?: boolean; open_mobile?: boolean }) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(Details, {
		target,
		props: {
			title: 'Definitions',
			...props,
			children: createRawSnippet(() => ({ render: () => '<p>Body content</p>' }))
		} as never
	});
	flushSync();
	return target.textContent?.includes('Body content') ?? false;
}

describe('Details starting state', () => {
	it.each([
		{ mobile: false, props: {}, expected: false },
		{ mobile: false, props: { open: true }, expected: true },
		{ mobile: false, props: { open: false, open_mobile: true }, expected: false },
		{ mobile: true, props: { open: true, open_mobile: false }, expected: false },
		{ mobile: true, props: { open: false, open_mobile: true }, expected: true },
		{ mobile: true, props: { open: true }, expected: true },
		{ mobile: true, props: {}, expected: false }
	])('mobile=$mobile $props → open=$expected', ({ mobile, props, expected }) => {
		stubViewport(mobile);
		expect(renderDetails(props)).toBe(expected);
	});
});
