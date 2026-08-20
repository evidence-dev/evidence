import { describe, it, expect, vi } from 'vitest';
import { installAuthorSideEffectTracker } from './author-side-effects';

// A throwaway window-like target per test, so wrapping its methods can't leak
// across cases (and we never mutate the real global). `window` and `document`
// are real EventTargets; timers delegate to the global (real or faked) ones.
function makeFakeWindow() {
	const win = new EventTarget() as unknown as Window & typeof globalThis & { document: EventTarget };
	(win as { document: EventTarget }).document = new EventTarget();
	win.setInterval = globalThis.setInterval.bind(globalThis) as typeof globalThis.setInterval;
	win.clearInterval = globalThis.clearInterval.bind(globalThis) as typeof globalThis.clearInterval;
	win.setTimeout = globalThis.setTimeout.bind(globalThis) as typeof globalThis.setTimeout;
	win.clearTimeout = globalThis.clearTimeout.bind(globalThis) as typeof globalThis.clearTimeout;
	return win;
}

describe('installAuthorSideEffectTracker', () => {
	it('removes window + document listeners added after install on teardown', () => {
		const win = makeFakeWindow();
		const tracker = installAuthorSideEffectTracker(win);
		const onResize = vi.fn();
		const onClick = vi.fn();
		win.addEventListener('resize', onResize);
		win.document.addEventListener('click', onClick);

		win.dispatchEvent(new Event('resize'));
		win.document.dispatchEvent(new Event('click'));
		expect(onResize).toHaveBeenCalledTimes(1);
		expect(onClick).toHaveBeenCalledTimes(1);

		tracker.teardown();
		win.dispatchEvent(new Event('resize'));
		win.document.dispatchEvent(new Event('click'));
		// The stacked listeners are gone — a re-injected body starts clean.
		expect(onResize).toHaveBeenCalledTimes(1);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('clears intervals and timeouts on teardown', () => {
		vi.useFakeTimers();
		try {
			const win = makeFakeWindow();
			const tracker = installAuthorSideEffectTracker(win);
			const tick = vi.fn();
			const later = vi.fn();
			win.setInterval(tick, 100);
			win.setTimeout(later, 100);

			tracker.teardown();
			vi.advanceTimersByTime(500);
			expect(tick).not.toHaveBeenCalled();
			expect(later).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});

	it('does not throw when the author already removed a listener (no double-free)', () => {
		const win = makeFakeWindow();
		const tracker = installAuthorSideEffectTracker(win);
		const fn = vi.fn();
		win.addEventListener('resize', fn);
		win.removeEventListener('resize', fn);

		expect(() => tracker.teardown()).not.toThrow();
		win.dispatchEvent(new Event('resize'));
		expect(fn).not.toHaveBeenCalled();
	});
});
