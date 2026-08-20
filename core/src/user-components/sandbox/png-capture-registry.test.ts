// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
	getSandboxFrameCapture,
	registerSandboxFrameCapture,
	unregisterSandboxFrameCapture
} from './png-capture-registry';

/**
 * The registry is the bridge from "PNG export sees an iframe in the DOM" to
 * "ask that iframe's SandboxFrame component for its rasterized PNG". It must
 * survive the obvious operations (register/lookup/unregister) and not leak
 * across iframes that share other properties (different elements get
 * different functions).
 */

describe('png-capture-registry', () => {
	it('returns the registered capture fn for the matching iframe element', async () => {
		const iframe = document.createElement('iframe');
		const fn = vi.fn(async () => 'data:image/png;base64,foo');
		registerSandboxFrameCapture(iframe, fn);

		const got = getSandboxFrameCapture(iframe);
		expect(got).toBe(fn);
		await got?.(2);
		expect(fn).toHaveBeenCalledWith(2);
	});

	it('returns undefined for an iframe that was never registered', () => {
		const iframe = document.createElement('iframe');
		expect(getSandboxFrameCapture(iframe)).toBeUndefined();
	});

	it('isolates entries per iframe — registering one does not leak to others', () => {
		const a = document.createElement('iframe');
		const b = document.createElement('iframe');
		const fnA = vi.fn(async () => 'a');
		const fnB = vi.fn(async () => 'b');
		registerSandboxFrameCapture(a, fnA);
		registerSandboxFrameCapture(b, fnB);

		expect(getSandboxFrameCapture(a)).toBe(fnA);
		expect(getSandboxFrameCapture(b)).toBe(fnB);
	});

	it('unregister removes the entry; subsequent lookups return undefined', () => {
		const iframe = document.createElement('iframe');
		registerSandboxFrameCapture(iframe, vi.fn());
		expect(getSandboxFrameCapture(iframe)).toBeDefined();

		unregisterSandboxFrameCapture(iframe);
		expect(getSandboxFrameCapture(iframe)).toBeUndefined();
	});

	it('unregistering an unknown iframe is a no-op (does not throw)', () => {
		const iframe = document.createElement('iframe');
		expect(() => unregisterSandboxFrameCapture(iframe)).not.toThrow();
	});

	it('re-registering the same iframe replaces the prior fn', () => {
		// Matches the "SandboxFrame remounts" case in dev/HMR.
		const iframe = document.createElement('iframe');
		const first = vi.fn(async () => 'old');
		const second = vi.fn(async () => 'new');

		registerSandboxFrameCapture(iframe, first);
		registerSandboxFrameCapture(iframe, second);

		expect(getSandboxFrameCapture(iframe)).toBe(second);
	});
});
