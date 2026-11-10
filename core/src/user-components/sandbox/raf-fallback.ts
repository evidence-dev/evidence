// Safari withholds rAF from offscreen sandbox iframes for seconds; import before zrender binds it.
export const RAF_FALLBACK_MS = 100;

export function installRafFallback(win: Window, fallbackMs = RAF_FALLBACK_MS): void {
	const nativeRequest = win.requestAnimationFrame.bind(win);
	const nativeCancel = win.cancelAnimationFrame.bind(win);
	const timers = new Map<number, ReturnType<typeof setTimeout>>();

	win.requestAnimationFrame = (callback: FrameRequestCallback): number => {
		let ran = false;
		const run = (time: number) => {
			if (ran) return;
			ran = true;
			nativeCancel(id);
			clearTimeout(timers.get(id));
			timers.delete(id);
			callback(time);
		};
		const id = nativeRequest(run);
		timers.set(
			id,
			setTimeout(() => run(win.performance.now()), fallbackMs)
		);
		return id;
	};

	win.cancelAnimationFrame = (id: number): void => {
		nativeCancel(id);
		clearTimeout(timers.get(id));
		timers.delete(id);
	};
}

if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
	installRafFallback(window);
}
