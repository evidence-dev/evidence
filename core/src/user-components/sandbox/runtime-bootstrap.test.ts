// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootSandbox, type SandboxHost } from './runtime-bootstrap';
import type { SandboxLogEntry } from './log-protocol';

/**
 * Integration test for the iframe-side bootstrap. Exercises the real
 * handshake in jsdom — real `window.postMessage`, real `MessageChannel`,
 * real `MessagePort`, real `console.error` — because every primitive we
 * could mock is exactly the wiring we want to validate end-to-end.
 *
 * In jsdom, `window.parent === window` by default, so the "parent" and
 * "sandbox" share the same realm — close enough to test the protocol
 * mechanics, which don't depend on cross-realm semantics.
 */

const SOURCE = 'evidence-test-sandbox';
const VERSION = 1;

/** Wait one microtask flush so async postMessage delivery happens. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Poll-wait for a predicate to become true. Used over `await flush()` when
 * the awaited thing involves multiple async steps (e.g. capture-png:
 * onCapturePng is awaited, response is constructed, then postMessage'd).
 * Without polling, a single flush sometimes lands BEFORE the response is
 * posted, causing flaky-by-suite-ordering failures.
 */
async function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (!predicate() && Date.now() < deadline) {
		await new Promise((r) => setTimeout(r, 5));
	}
}

interface CapturedInit {
	type: 'init';
	greeting: string;
}

afterEach(() => {
	// jsdom shares the window across tests in a file; clear our listener so
	// subsequent tests get a fresh bootSandbox.
	vi.restoreAllMocks();
});

/**
 * Drive a full handshake: spin up bootSandbox, watch for the `ready`
 * message it posts to its parent, then deliver an `init` message back to
 * it carrying a MessageChannel port. Returns handles for asserting on
 * subsequent traffic.
 */
async function handshake(opts: {
	onInit?: (init: CapturedInit, host: SandboxHost) => void;
	onMessage?: (msg: { type: string } & Record<string, unknown>, host: SandboxHost) => void;
}): Promise<{
	parentPort: MessagePort;
	parentInbox: ({ type: string } & Record<string, unknown>)[];
}> {
	const readyPromise = new Promise<void>((resolve) => {
		const onReady = (event: MessageEvent) => {
			const data = event.data as { source?: string; type?: string } | null;
			if (data?.source === SOURCE && data.type === 'ready') {
				window.removeEventListener('message', onReady);
				resolve();
			}
		};
		window.addEventListener('message', onReady);
	});

	bootSandbox<CapturedInit & { type: 'init' }>({
		source: SOURCE,
		version: VERSION,
		onInit: opts.onInit ?? (() => {}),
		onMessage: opts.onMessage
	});

	await readyPromise;

	// Now play the parent. JSDOM's window.postMessage does NOT transfer
	// MessagePort entries in the third arg — they silently drop. Dispatch a
	// synthetic MessageEvent directly so the port reaches bootSandbox's
	// handler. This is the same event shape the browser would deliver.
	const channel = new MessageChannel();
	const parentInbox: ({ type: string } & Record<string, unknown>)[] = [];
	channel.port1.onmessage = (event) => {
		parentInbox.push(event.data);
	};

	const initEvent = new MessageEvent('message', {
		data: { source: SOURCE, v: VERSION, instanceId: 'inst-1', type: 'init', greeting: 'hi' },
		source: window,
		ports: [channel.port2]
	});
	window.dispatchEvent(initEvent);

	await flush();
	return { parentPort: channel.port1, parentInbox };
}

describe('bootSandbox handshake', () => {
	it('posts {type: ready} to the parent window on startup', async () => {
		const ready = vi.fn();
		const listener = (event: MessageEvent) => {
			const data = event.data as { source?: string; type?: string } | null;
			if (data?.source === SOURCE && data.type === 'ready') ready();
		};
		window.addEventListener('message', listener);

		bootSandbox({ source: SOURCE, version: VERSION, onInit: () => {} });
		await flush();

		expect(ready).toHaveBeenCalled();
		window.removeEventListener('message', listener);
	});

	it('invokes onInit with the init payload and a usable host', async () => {
		const onInit = vi.fn<(init: CapturedInit, host: SandboxHost) => void>();
		await handshake({ onInit });

		expect(onInit).toHaveBeenCalledTimes(1);
		const [init, host] = onInit.mock.calls[0];
		expect(init.greeting).toBe('hi');
		expect(typeof host.post).toBe('function');
		expect(typeof host.postLog).toBe('function');
	});

	it('dispatches subsequent port messages to onMessage with the same host instance', async () => {
		let hostFromInit: SandboxHost | undefined;
		let hostFromMessage: SandboxHost | undefined;
		const onMessage = vi.fn(
			(msg: { type: string } & Record<string, unknown>, host: SandboxHost) => {
				hostFromMessage = host;
				void msg;
			}
		);

		const { parentPort } = await handshake({
			onInit: (_init, host) => {
				hostFromInit = host;
			},
			onMessage
		});

		parentPort.postMessage({
			source: SOURCE,
			v: VERSION,
			instanceId: 'inst-1',
			type: 'data',
			payload: 99
		});
		await flush();

		expect(onMessage).toHaveBeenCalledTimes(1);
		expect(onMessage.mock.calls[0][0]).toMatchObject({ type: 'data', payload: 99 });
		// Stable host instance: same reference across the lifetime of the iframe.
		expect(hostFromMessage).toBe(hostFromInit);
	});

	it('drops messages with the wrong source discriminator (cross-consumer isolation)', async () => {
		const onMessage = vi.fn();
		const { parentPort } = await handshake({ onMessage });

		parentPort.postMessage({
			source: 'evidence-other-sandbox',
			v: VERSION,
			instanceId: 'inst-1',
			type: 'data'
		});
		await flush();

		expect(onMessage).not.toHaveBeenCalled();
	});

	it('drops messages with a mismatched protocol version AND warns loudly (deduped)', async () => {
		// Stale cached runtime is the most likely root cause of "nothing
		// renders, no error" in production. The previous design dropped these
		// messages silently — no signal to the human, no signal to debug_code.
		// Now: console.warn (which the installed console-forwarder lifts into
		// the log pipeline automatically — see the 'forwards a console.error'
		// test below for that half), deduped per source so a flood of
		// mismatched messages doesn't drown out everything else.
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const onMessage = vi.fn();
		const { parentPort } = await handshake({ onMessage });

		// Send two mismatched messages — only ONE warning should be emitted.
		parentPort.postMessage({
			source: SOURCE,
			v: VERSION + 5,
			instanceId: 'inst-1',
			type: 'data'
		});
		parentPort.postMessage({
			source: SOURCE,
			v: VERSION + 5,
			instanceId: 'inst-1',
			type: 'data'
		});
		await flush();

		expect(onMessage).not.toHaveBeenCalled();
		const warnings = consoleSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('protocol version mismatch')
		);
		expect(warnings).toHaveLength(1);

		consoleSpy.mockRestore();
	});

	it('host.post sends an enveloped message back over the channel', async () => {
		let captured: SandboxHost | undefined;
		const { parentInbox } = await handshake({
			onInit: (_i, host) => {
				captured = host;
			}
		});

		captured?.post({ type: 'rendered' });
		await flush();

		expect(parentInbox).toHaveLength(1);
		expect(parentInbox[0]).toMatchObject({
			source: SOURCE,
			v: VERSION,
			instanceId: 'inst-1',
			type: 'rendered'
		});
	});

	it('host.postLog reaches the parent as a {type: log, entry} message', async () => {
		let host: SandboxHost | undefined;
		const { parentInbox } = await handshake({
			onInit: (_i, h) => {
				host = h;
			}
		});

		const logEntry: SandboxLogEntry = {
			level: 'error',
			source: 'script',
			message: 'oops',
			stack: 'stack trace here'
		};
		host?.postLog(logEntry);
		await flush();

		expect(parentInbox).toHaveLength(1);
		expect(parentInbox[0]).toMatchObject({
			source: SOURCE,
			type: 'log',
			entry: logEntry
		});
	});

	it('routes a capture-png rpc-request to onCapturePng and replies with the data URL', async () => {
		// PNG export of sandboxed iframes requires the iframe to rasterize
		// its own contents (parent's html-to-image can't see across origins).
		// capture-png is now a kind on the shared request/response primitive:
		// the bootstrap registers onCapturePng as the handler and the RPC layer
		// handles correlation IDs, errors, and response posting. Consumers just
		// provide the rasterizer (chart.getDataURL for echart, html-to-image on
		// document.body for the html component).
		const FAKE_DATA_URL = 'data:image/png;base64,fakecontent';
		const onCapturePng = vi.fn(() => FAKE_DATA_URL);

		const readyPromise = new Promise<void>((resolve) => {
			const onReady = (event: MessageEvent) => {
				const data = event.data as { source?: string; type?: string } | null;
				if (data?.source === SOURCE && data.type === 'ready') {
					window.removeEventListener('message', onReady);
					resolve();
				}
			};
			window.addEventListener('message', onReady);
		});

		bootSandbox({ source: SOURCE, version: VERSION, onInit: () => {}, onCapturePng });
		await readyPromise;

		const channel = new MessageChannel();
		const inbox: ({ type: string } & Record<string, unknown>)[] = [];
		channel.port1.onmessage = (event) => inbox.push(event.data);

		const initEvent = new MessageEvent('message', {
			data: { source: SOURCE, v: VERSION, instanceId: 'inst-1', type: 'init' },
			source: window,
			ports: [channel.port2]
		});
		window.dispatchEvent(initEvent);
		await flush();

		channel.port1.postMessage({
			source: SOURCE,
			v: VERSION,
			instanceId: 'inst-1',
			type: 'rpc-request',
			requestId: 'req-42',
			kind: 'capture-png',
			payload: { pixelRatio: 3 }
		});
		await waitFor(() => inbox.some((m) => m.type === 'rpc-response'));

		expect(onCapturePng).toHaveBeenCalledWith(3);
		const response = inbox.find((m) => m.type === 'rpc-response');
		expect(response).toMatchObject({
			type: 'rpc-response',
			requestId: 'req-42',
			ok: true,
			result: FAKE_DATA_URL
		});
	});

	it('translates an onCapturePng throw into an error rpc-response with the message', async () => {
		// Consumer can throw to signal "not ready" / "no chart yet" — parent
		// uses the error to decide fallback behavior (leave iframe blank vs
		// retry, etc.). The RPC layer MUST NOT crash on the throw.
		const onCapturePng = vi.fn(() => {
			throw new Error('chart not initialized');
		});

		const readyPromise = new Promise<void>((resolve) => {
			const onReady = (event: MessageEvent) => {
				const data = event.data as { source?: string; type?: string } | null;
				if (data?.source === SOURCE && data.type === 'ready') {
					window.removeEventListener('message', onReady);
					resolve();
				}
			};
			window.addEventListener('message', onReady);
		});

		bootSandbox({ source: SOURCE, version: VERSION, onInit: () => {}, onCapturePng });
		await readyPromise;

		const channel = new MessageChannel();
		const inbox: ({ type: string } & Record<string, unknown>)[] = [];
		channel.port1.onmessage = (event) => inbox.push(event.data);
		window.dispatchEvent(
			new MessageEvent('message', {
				data: { source: SOURCE, v: VERSION, instanceId: 'inst-1', type: 'init' },
				source: window,
				ports: [channel.port2]
			})
		);
		await flush();

		channel.port1.postMessage({
			source: SOURCE,
			v: VERSION,
			instanceId: 'inst-1',
			type: 'rpc-request',
			requestId: 'req-99',
			kind: 'capture-png'
		});
		await waitFor(() => inbox.some((m) => m.type === 'rpc-response'));

		const response = inbox.find((m) => m.type === 'rpc-response');
		expect(response).toMatchObject({
			type: 'rpc-response',
			requestId: 'req-99',
			ok: false,
			error: 'chart not initialized'
		});
		expect(response).not.toHaveProperty('result');
	});

	it('forwards a console.error from inside the sandbox to the parent as a log entry', async () => {
		const { parentInbox } = await handshake({ onInit: () => {} });

		// The console wrap is installed inside bootSandbox.start() after the
		// handshake. Trigger a console.error and watch for a log message.
		console.error('something broke during render');
		await flush();

		const logs = parentInbox.filter((m) => m.type === 'log');
		expect(logs.length).toBeGreaterThan(0);
		const entry = (logs[logs.length - 1] as unknown as { entry: SandboxLogEntry }).entry;
		expect(entry.level).toBe('error');
		expect(entry.source).toBe('console');
		expect(entry.message).toContain('something broke during render');
	});
});
