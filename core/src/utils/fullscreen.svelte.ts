import { untrack } from 'svelte';
import { page } from '$app/state';
import { afterNavigate, goto } from '$app/navigation';

// Fullscreen presentation mode shared across viewers. State lives in a
// `?fullscreen` URL param; controls auto-hide after `hideDelay` ms idle.
export function createFullscreen({ hideDelay = 3000 }: { hideDelay?: number } = {}) {
	const active = $derived(page.url.searchParams.get('fullscreen') !== null);
	let showControls = $state(true);
	let hideTimeout: ReturnType<typeof setTimeout>;

	afterNavigate(({ from, to }) => {
		if (
			from?.url.searchParams.has('fullscreen') &&
			!to?.url.searchParams.has('fullscreen') &&
			document.fullscreenElement
		) {
			document.exitFullscreen?.();
		}
	});

	function scheduleHide() {
		clearTimeout(hideTimeout);
		hideTimeout = setTimeout(() => {
			showControls = false;
		}, hideDelay);
	}

	function handleMouseMove() {
		showControls = true;
		scheduleHide();
	}

	function enter() {
		const url = new URL(page.url);
		url.searchParams.set('fullscreen', '');
		goto(url.toString(), { replaceState: true });
		document.documentElement.requestFullscreen?.();
	}

	function exit() {
		const url = new URL(page.url);
		url.searchParams.delete('fullscreen');
		goto(url.toString(), { replaceState: true });
		if (document.fullscreenElement) {
			document.exitFullscreen?.();
		}
	}

	$effect(() => {
		// untracked: only arm on initial mount, not when entering later
		if (untrack(() => active)) scheduleHide();

		const handleFullscreenChange = () => {
			if (!document.fullscreenElement && active) exit();
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			clearTimeout(hideTimeout);
		};
	});

	return {
		get active() {
			return active;
		},
		get showControls() {
			return showControls;
		},
		handleMouseMove,
		enter,
		exit
	};
}
