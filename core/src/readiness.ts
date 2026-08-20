import { getPageRenderTrackerContext } from './page-render-tracker.context.svelte';

export function createRenderTask(componentName: string): () => void {
	const tracker = getPageRenderTrackerContext?.();
	const complete = tracker?.startTask(componentName);
	return () => {
		try {
			complete?.();
		} catch {
			// no-op
		}
	};
}

export async function waitForFonts(): Promise<void> {
	const doc = document as unknown as { fonts?: { ready?: Promise<void> } };
	const ready = doc?.fonts?.ready;
	if (ready && typeof ready.then === 'function') {
		try {
			await ready;
		} catch {
			// ignore
		}
	}
}

export async function waitForStableFrames(node: HTMLElement): Promise<void> {
	return new Promise((resolve) => {
		let last: [number, number] | undefined;
		let prev: [number, number] | undefined;
		const check = () => {
			const cur: [number, number] = [node.clientWidth, node.clientHeight];
			if (
				prev &&
				last &&
				prev[0] === last[0] &&
				prev[1] === last[1] &&
				last[0] === cur[0] &&
				last[1] === cur[1]
			) {
				resolve();
				return;
			}
			prev = last;
			last = cur;
			requestAnimationFrame(check);
		};
		requestAnimationFrame(check);
	});
}
