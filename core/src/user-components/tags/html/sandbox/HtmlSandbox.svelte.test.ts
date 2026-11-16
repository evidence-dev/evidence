// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import HtmlSandbox from './HtmlSandbox.svelte';
import { HTML_SANDBOX_MESSAGE_SOURCE, HTML_SANDBOX_PROTOCOL_VERSION } from './html-protocol';
import type { HtmlPageEntry } from './html-protocol';

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

function mountHtmlSandbox(extraProps: Record<string, unknown> = {}): HTMLIFrameElement {
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
			runQuery: async () => ({ rows: [] }),
			...extraProps
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

/**
 * Drives `evidence.pages()` the way the iframe runtime does: handshake via
 * `ready`, then an `rpc-request` of kind `pages` over the transferred port.
 */
async function requestPagesThroughFrame(iframe: HTMLIFrameElement): Promise<unknown> {
	const postMessage = vi.fn();
	const contentWindow = { postMessage } as unknown as Window;
	Object.defineProperty(iframe, 'contentWindow', { value: contentWindow, configurable: true });

	const envelope = { source: HTML_SANDBOX_MESSAGE_SOURCE, v: HTML_SANDBOX_PROTOCOL_VERSION };
	window.dispatchEvent(
		new MessageEvent('message', { data: { ...envelope, type: 'ready' }, source: contentWindow })
	);
	flushSync();

	const [init, , [port]] = postMessage.mock.calls[0] as [
		{ instanceId: string },
		string,
		MessagePort[]
	];
	const reply = new Promise<unknown>((resolve) => {
		port.onmessage = (event) => {
			if (event.data?.type === 'rpc-response') resolve(event.data);
		};
	});
	port.postMessage({
		...envelope,
		instanceId: init.instanceId,
		type: 'rpc-request',
		requestId: 'req-1',
		kind: 'pages',
		payload: {}
	});
	const response = await reply;
	port.close();
	return response;
}

describe('HtmlSandbox pages request', () => {
	it('answers a sandbox `pages` request from the host page list', async () => {
		const pages: HtmlPageEntry[] = [
			{ title: 'Spend', path: '/finance/spend', project: null, directory: 'Finance' }
		];
		const iframe = mountHtmlSandbox({ listPages: async () => pages });

		expect(await requestPagesThroughFrame(iframe)).toMatchObject({
			requestId: 'req-1',
			ok: true,
			result: { pages }
		});
	});

	it('answers an empty list when the host has no page list', async () => {
		const iframe = mountHtmlSandbox();

		expect(await requestPagesThroughFrame(iframe)).toMatchObject({
			ok: true,
			result: { pages: [] }
		});
	});
});
