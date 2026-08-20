// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Link from './Link.svelte';

vi.mock('../../Renderer/renderer-context', () => ({
	getRendererContext: () => ({ context: 'published' })
}));

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

function renderLink(href: string): HTMLAnchorElement {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(Link, { target, props: { href } });
	flushSync();

	const anchor = target.querySelector('a');
	if (!anchor) throw new Error('Link did not render an anchor');
	return anchor;
}

describe('Link URL safety', () => {
	it('renders safe external links in an isolated new tab', () => {
		const anchor = renderLink('https://example.com');

		expect(anchor.getAttribute('href')).toBe('https://example.com');
		expect(anchor.getAttribute('target')).toBe('_blank');
		expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('rewrites unsafe external links', () => {
		const anchor = renderLink('javascript:alert(1)');

		expect(anchor.getAttribute('href')).toBe('about:blank');
	});

	it('keeps internal links in the current tab', () => {
		const anchor = renderLink('/project/report');

		expect(anchor.getAttribute('target')).toBeNull();
		expect(anchor.getAttribute('rel')).toBeNull();
	});
});
