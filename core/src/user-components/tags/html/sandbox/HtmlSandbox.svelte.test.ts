// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import HtmlSandbox from './HtmlSandbox.svelte';

/**
 * The html block opens links THROUGH THE PARENT (open-url message), so its
 * iframe must keep the bare `allow-scripts` sandbox — no popup tokens. If a
 * future change grants `allow-popups`, code in the frame (a compromised CDN
 * library included) could open a tab to any URL carrying query data, which
 * is exactly the egress the sandbox exists to block.
 */

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) {
		unmount(mounted);
		mounted = undefined;
	}
	target?.remove();
	target = undefined;
});

function mountHtmlSandbox(): HTMLIFrameElement {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(HtmlSandbox, {
		target,
		props: {
			html: '<p>hi</p>',
			variables: {},
			theme: {
				mode: 'light',
				palette: [],
				background: '#fff',
				foreground: '#111',
				mutedForeground: '#666',
				border: '#eee'
			},
			filters: {},
			runQuery: async () => ({ rows: [] })
		}
	});
	flushSync();
	const iframe = target.querySelector('iframe');
	if (!iframe) throw new Error('HtmlSandbox did not render an iframe');
	return iframe;
}

describe('HtmlSandbox iframe sandbox attribute', () => {
	it('is exactly allow-scripts — no popup, same-origin, or top-navigation tokens', () => {
		expect(mountHtmlSandbox().getAttribute('sandbox')).toBe('allow-scripts');
	});
});
