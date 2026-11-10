import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installRafFallback } from './raf-fallback';

function fakeWindow() {
	let nextId = 1;
	const pending = new Map<number, FrameRequestCallback>();
	const win = {
		performance: { now: () => 42 },
		requestAnimationFrame: (cb: FrameRequestCallback) => {
			const id = nextId++;
			pending.set(id, cb);
			return id;
		},
		cancelAnimationFrame: (id: number) => {
			pending.delete(id);
		}
	} as unknown as Window;
	const flushFrames = (time: number) => {
		const callbacks = [...pending.values()];
		pending.clear();
		for (const cb of callbacks) cb(time);
	};
	return { win, flushFrames, pending };
}

describe('installRafFallback', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('runs the callback from the timer when the browser withholds the frame', () => {
		const { win } = fakeWindow();
		installRafFallback(win, 100);
		const cb = vi.fn();
		win.requestAnimationFrame(cb);

		vi.advanceTimersByTime(99);
		expect(cb).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(cb).toHaveBeenCalledExactlyOnceWith(42);
	});

	it('runs once from the native frame and never again from the timer', () => {
		const { win, flushFrames } = fakeWindow();
		installRafFallback(win, 100);
		const cb = vi.fn();
		win.requestAnimationFrame(cb);

		flushFrames(16);
		vi.advanceTimersByTime(1000);
		expect(cb).toHaveBeenCalledExactlyOnceWith(16);
	});

	it('drops the native frame once the timer has run the callback', () => {
		const { win, pending } = fakeWindow();
		installRafFallback(win, 100);
		win.requestAnimationFrame(vi.fn());

		vi.advanceTimersByTime(100);
		expect(pending.size).toBe(0);
	});

	it('cancels both the native frame and the timer', () => {
		const { win, flushFrames } = fakeWindow();
		installRafFallback(win, 100);
		const cb = vi.fn();
		const id = win.requestAnimationFrame(cb);

		win.cancelAnimationFrame(id);
		flushFrames(16);
		vi.advanceTimersByTime(1000);
		expect(cb).not.toHaveBeenCalled();
	});
});
