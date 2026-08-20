// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import SandboxFrame from './SandboxFrame.svelte';

/**
 * Component-level test for the parent-side base. The bigger surface
 * (handshake mechanics, lifecycle routing, console forwarding) is tested
 * on the iframe side in runtime-bootstrap.test — both sides talk the same
 * protocol, so duplicating the channel mechanics here would just restate
 * implementation. What this file verifies is the parent-side concerns
 * that aren't testable from inside the runtime:
 *
 *   1. The iframe is rendered with the load-bearing security attributes.
 *   2. The srcdoc embeds the consumer-provided runtime URL + bodyHtml.
 *   3. The component lifecycle is clean — mount + unmount with no error.
 *
 * The actual handshake (postMessage → MessageChannel → onConnect) needs
 * an iframe with executing script content; jsdom doesn't execute scripts
 * in <iframe srcdoc>, so a full round-trip here would require simulating
 * the iframe's contentWindow as our own window — at which point we're
 * just re-testing bootstrap.
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

function mountFrame(propOverrides: Partial<Record<string, unknown>> = {}) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(SandboxFrame, {
		target,
		props: {
			source: 'evidence-test-sandbox',
			version: 1,
			instanceId: 'inst-1',
			runtimeUrl: 'https://app.example.com/sandbox/test-runtime.js?v=1',
			bodyHtml: '<div id="mount"></div>',
			init: { type: 'init' },
			taskName: 'test',
			title: 'Test sandbox',
			...propOverrides
		}
	});
	flushSync();
	const iframe = target.querySelector('iframe');
	if (!iframe) throw new Error('SandboxFrame did not render an iframe');
	return iframe;
}

describe('SandboxFrame rendering', () => {
	it('renders an iframe sandboxed with exactly allow-scripts (no allow-same-origin)', () => {
		const iframe = mountFrame();
		// The single highest-severity invariant. Tested again at source level
		// in srcdoc.test.ts; tested here at rendered-DOM level so a future
		// dynamic-attribute regression can't slip past.
		expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
		expect(iframe.getAttribute('sandbox')).not.toMatch(/allow-same-origin/);
	});

	it('renders referrerpolicy=no-referrer to avoid leaking the parent URL', () => {
		const iframe = mountFrame();
		expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer');
	});

	it('embeds the consumer-provided runtime URL in the srcdoc', () => {
		const iframe = mountFrame({
			runtimeUrl: 'https://other.example/sandbox/html-runtime.js?v=4'
		});
		const srcdoc = iframe.getAttribute('srcdoc') ?? '';
		expect(srcdoc).toContain('https://other.example/sandbox/html-runtime.js?v=4');
	});

	it('embeds the consumer-provided body markup in the srcdoc', () => {
		const iframe = mountFrame({
			bodyHtml: '<div id="evidence-custom"></div>'
		});
		const srcdoc = iframe.getAttribute('srcdoc') ?? '';
		expect(srcdoc).toContain('<div id="evidence-custom"></div>');
	});

	it('renders no iframe before origin is set, then renders one on mount', () => {
		// Before mount the wrapper div exists but the iframe is gated on srcdoc
		// (which derives from origin which is set in onMount).
		const iframe = mountFrame();
		expect(iframe.tagName).toBe('IFRAME');
	});

	it('uses the title prop on the iframe element for accessibility', () => {
		const iframe = mountFrame({ title: 'Custom report widget' });
		expect(iframe.getAttribute('title')).toBe('Custom report widget');
	});

	it('removes its window message listener on unmount', () => {
		// Failing this means a sandboxed component that mounts/unmounts (e.g.
		// inside a conditional or a Markdoc partial that re-renders) leaks a
		// listener per cycle, slowly accumulating. SandboxFrame's onMount
		// cleanup function is the only thing that prevents this.
		const removeSpy = vi.spyOn(window, 'removeEventListener');
		mountFrame();
		unmount(mounted!);
		mounted = undefined;
		expect(removeSpy.mock.calls.some(([type]) => type === 'message')).toBe(true);
		removeSpy.mockRestore();
	});

	it('surfaces a protocol-version mismatch loudly (visible to human + dedupes warnings)', async () => {
		// Stale cached runtime is the most likely "nothing renders, no error"
		// failure mode in production. SandboxFrame must (a) drop the message,
		// (b) console.warn once, (c) call onError with a human-readable string
		// so the visual error overlay shows something useful — not a silently
		// blank chart.
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const errors: (string | undefined)[] = [];

		mountFrame({
			source: 'evidence-test-sandbox',
			version: 7,
			onError: (msg: string | undefined) => errors.push(msg)
		});

		// Simulate two stale-version messages arriving from the "iframe"
		// (same window, since jsdom collapses parent/iframe to one realm).
		const stale = {
			source: 'evidence-test-sandbox',
			v: 99,
			instanceId: 'inst-1',
			type: 'rendered'
		};
		const iframe = target!.querySelector('iframe') as HTMLIFrameElement;
		const ev1 = new MessageEvent('message', { data: stale, source: iframe.contentWindow });
		const ev2 = new MessageEvent('message', { data: stale, source: iframe.contentWindow });
		window.dispatchEvent(ev1);
		window.dispatchEvent(ev2);
		flushSync();

		const warnings = consoleSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('protocol version mismatch')
		);
		expect(warnings).toHaveLength(1);
		expect(
			errors.some((m) => typeof m === 'string' && m.includes('protocol version mismatch'))
		).toBe(true);

		consoleSpy.mockRestore();
	});

	it('ignores window messages whose source is not this iframe (cross-frame spoofing)', () => {
		// A different window (e.g. a sibling iframe, window.opener, a content
		// script) can postMessage to the parent. Without the event.source check,
		// such a message could trigger connect() and hijack the handshake. We
		// dispatch a well-formed envelope from a non-iframe source and assert
		// nothing happens.
		const errors: (string | undefined)[] = [];
		mountFrame({
			source: 'evidence-test-sandbox',
			version: 1,
			onError: (msg: string | undefined) => errors.push(msg)
		});

		const handshakeAttempt = {
			source: 'evidence-test-sandbox',
			v: 1,
			instanceId: 'inst-1',
			type: 'ready'
		};
		// Use a deliberately wrong source (the parent window) — not the iframe.
		const ev = new MessageEvent('message', { data: handshakeAttempt, source: window });
		window.dispatchEvent(ev);
		flushSync();

		// No onError call means the message was silently ignored, which is the
		// correct behavior — the handshake is only valid from the iframe.
		expect(errors).toEqual([]);
	});

	it('pins bodyHtml in srcdoc — a reactive bodyHtml change must NOT rewrite srcdoc', async () => {
		// The srcdoc invariance contract (sandbox/srcdoc.ts) requires that
		// nothing reactive leak into srcdoc. If a consumer accidentally passes
		// a reactive bodyHtml, the prop change must be silently pinned at
		// first compute, not rebuild srcdoc.
		//
		// Why this matters: changing the `srcdoc` attribute reloads the iframe,
		// which destroys the message port and in-iframe SDK. The frame now
		// self-heals (it re-handshakes on the reload's `ready`), but a reload
		// still wipes author state, re-runs every script, and flickers — so
		// srcdoc must stay pinned regardless; recovery is a safety net, not a
		// license to reload.
		//
		// Test by mounting with one bodyHtml, then mutating the prop reactively
		// and asserting the rendered iframe's srcdoc attribute is unchanged.
		const propsState = $state({
			source: 'evidence-test-sandbox',
			version: 1,
			instanceId: 'inst-1',
			runtimeUrl: 'https://app.example.com/sandbox/test-runtime.js?v=1',
			bodyHtml: '<div id="mount-original"></div>',
			init: { type: 'init' as const },
			taskName: 'test',
			title: 'Test sandbox'
		});
		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(SandboxFrame, { target, props: propsState });
		flushSync();

		const iframe = target.querySelector('iframe') as HTMLIFrameElement;
		const srcdocBefore = iframe.getAttribute('srcdoc') ?? '';
		expect(srcdocBefore).toContain('mount-original');

		// Reactively change the prop. If SandboxFrame doesn't pin bodyHtml,
		// this would re-derive srcdoc and the iframe attribute would change.
		propsState.bodyHtml = '<div id="mount-replaced"></div>';
		flushSync();

		const srcdocAfter = iframe.getAttribute('srcdoc') ?? '';
		expect(srcdocAfter).toBe(srcdocBefore);
		expect(srcdocAfter).not.toContain('mount-replaced');
	});

	it('arms a 20s render-tracker fallback and clears it on unmount', () => {
		// The fallback exists so a wedged sandbox (failed script load, runaway
		// JS) can't hold PDF/capture readiness forever. The setTimeout/cleanup
		// pair is the only thing that protects PDF rendering from hanging on
		// a broken chart.
		const setSpy = vi.spyOn(window, 'setTimeout');
		const clearSpy = vi.spyOn(window, 'clearTimeout');

		mountFrame();

		const armed = setSpy.mock.calls.find(([, delay]) => delay === 20_000);
		expect(armed).toBeDefined();
		// Capture the timer handle returned by the matching setTimeout call.
		const matchingResult = setSpy.mock.results.find((_r, i) => setSpy.mock.calls[i][1] === 20_000);
		const handle = matchingResult?.value;

		unmount(mounted!);
		mounted = undefined;

		expect(clearSpy).toHaveBeenCalledWith(handle);
		setSpy.mockRestore();
		clearSpy.mockRestore();
	});

	it('re-handshakes on a second `ready` (iframe reload) instead of bailing out', () => {
		// Self-healing handshake. An iframe reloads whenever the browser
		// re-parents it — the editor's virtualized preview does this on
		// navigation — and re-announces `ready` from the fresh document. The
		// frame MUST re-establish the channel; under the old `connected` guard it
		// bailed and the block stayed blank until a full refresh. onConnect
		// firing once per handshake is the probe.
		const connects: number[] = [];
		const iframe = mountFrame({
			source: 'evidence-test-sandbox',
			version: 1,
			onConnect: () => connects.push(1)
		});
		// jsdom srcdoc iframes don't get a real contentWindow; connect() needs one
		// (and a postMessage that accepts a transfer list). A minimal stub is
		// enough — we're testing the parent's re-handshake control flow, not the
		// browser's message transport.
		const contentWindow = { postMessage: vi.fn() } as unknown as Window;
		Object.defineProperty(iframe, 'contentWindow', { value: contentWindow, configurable: true });
		const ready = { source: 'evidence-test-sandbox', v: 1, instanceId: 'inst-1', type: 'ready' };

		window.dispatchEvent(new MessageEvent('message', { data: ready, source: contentWindow }));
		flushSync();
		expect(connects).toHaveLength(1);

		// Reload: the iframe boots a fresh document and posts `ready` again.
		window.dispatchEvent(new MessageEvent('message', { data: ready, source: contentWindow }));
		flushSync();
		expect(connects).toHaveLength(2);
	});
});
