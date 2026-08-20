/**
 * Reclaims the global side effects author code registers inside the `{% html %}`
 * sandbox — window/document event listeners and timers/animation frames — so a
 * live re-inject (body edit in the editor) can undo them.
 *
 * Why this exists: a re-inject already replaces the DOM mount (element-level
 * listeners die with their nodes) and resets the evidence SDK's subscriptions,
 * but a raw `window.addEventListener('resize', …)`, a `setInterval` loop, or a
 * `requestAnimationFrame` loop in the body would otherwise STACK on every edit
 * (each edit registers another). A published render / fresh page load injects
 * once, so this only bites while editing — but resize listeners and animation
 * loops are common in viz code. A fresh-iframe remount would reclaim these for
 * free; we deliberately keep the realm (so CDN libraries stay parsed for a fast
 * edit loop) and reclaim the side effects explicitly instead.
 *
 * Install ONCE, after the runtime's own listeners are registered, so only
 * author-registered effects are tracked. `teardown()` is called at the start of
 * each re-inject; the wrappers stay installed so the next body is tracked too.
 *
 * Residual gaps (acceptable — editing-only, and rare): listeners added to other
 * globals (`visualViewport`, a `MediaQueryList`, etc.) and effects scheduled via
 * APIs we don't wrap (`queueMicrotask`, observers the author constructs).
 */
export interface AuthorSideEffectTracker {
	/** Remove every tracked listener and clear every tracked timer/frame. */
	teardown(): void;
}

export function installAuthorSideEffectTracker(
	win: Window & typeof globalThis
): AuthorSideEffectTracker {
	type Reg = {
		target: EventTarget;
		type: string;
		listener: EventListenerOrEventListenerObject;
		options?: boolean | AddEventListenerOptions;
		// Captured before wrapping so teardown bypasses our own wrapper.
		nativeRemove: EventTarget['removeEventListener'];
	};
	const listeners = new Set<Reg>();

	const wrapTarget = (target: EventTarget): void => {
		const nativeAdd = target.addEventListener.bind(target);
		const nativeRemove = target.removeEventListener.bind(target);
		target.addEventListener = function (type, listener, options) {
			if (listener) listeners.add({ target, type, listener, options, nativeRemove });
			nativeAdd(type, listener, options);
		} as EventTarget['addEventListener'];
		target.removeEventListener = function (type, listener, options) {
			for (const r of listeners) {
				if (r.target === target && r.type === type && r.listener === listener) {
					listeners.delete(r);
					break;
				}
			}
			nativeRemove(type, listener, options);
		} as EventTarget['removeEventListener'];
	};
	wrapTarget(win);
	if (win.document) wrapTarget(win.document);

	const intervals = new Set<number>();
	const timeouts = new Set<number>();
	const frames = new Set<number>();

	const nativeSetInterval = win.setInterval.bind(win);
	const nativeClearInterval = win.clearInterval.bind(win);
	win.setInterval = function (handler: TimerHandler, timeout?: number, ...args: unknown[]) {
		const id = nativeSetInterval(handler, timeout, ...args);
		intervals.add(id);
		return id;
	} as typeof win.setInterval;
	win.clearInterval = function (id?: number) {
		if (typeof id === 'number') intervals.delete(id);
		nativeClearInterval(id);
	} as typeof win.clearInterval;

	const nativeSetTimeout = win.setTimeout.bind(win);
	const nativeClearTimeout = win.clearTimeout.bind(win);
	win.setTimeout = function (handler: TimerHandler, timeout?: number, ...args: unknown[]) {
		const id = nativeSetTimeout(handler, timeout, ...args);
		timeouts.add(id);
		return id;
	} as typeof win.setTimeout;
	win.clearTimeout = function (id?: number) {
		if (typeof id === 'number') timeouts.delete(id);
		nativeClearTimeout(id);
	} as typeof win.clearTimeout;

	const canRaf =
		typeof win.requestAnimationFrame === 'function' &&
		typeof win.cancelAnimationFrame === 'function';
	const nativeRaf = canRaf ? win.requestAnimationFrame.bind(win) : undefined;
	const nativeCancelRaf = canRaf ? win.cancelAnimationFrame.bind(win) : undefined;
	if (nativeRaf && nativeCancelRaf) {
		win.requestAnimationFrame = function (cb: FrameRequestCallback) {
			const id = nativeRaf(cb);
			frames.add(id);
			return id;
		} as typeof win.requestAnimationFrame;
		win.cancelAnimationFrame = function (id: number) {
			frames.delete(id);
			nativeCancelRaf(id);
		} as typeof win.cancelAnimationFrame;
	}

	return {
		teardown() {
			for (const r of listeners) r.nativeRemove.call(r.target, r.type, r.listener, r.options);
			listeners.clear();
			for (const id of intervals) nativeClearInterval(id);
			intervals.clear();
			for (const id of timeouts) nativeClearTimeout(id);
			timeouts.clear();
			if (nativeCancelRaf) for (const id of frames) nativeCancelRaf(id);
			frames.clear();
		}
	};
}
