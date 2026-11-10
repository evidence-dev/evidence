import type { AfterNavigate } from '@sveltejs/kit';
import { afterNavigate } from '$app/navigation';

type NavigationEnds = Pick<AfterNavigate, 'from' | 'to'>;

// Only a move to another page resets: query changes (filters, `?fullscreen`)
// stay on the same page, and SvelteKit has already scrolled to any `#hash`.
export function shouldResetScroll({ from, to }: NavigationEnds): boolean {
	if (!from || !to) return false;
	return from.url.pathname !== to.url.pathname && !to.url.hash;
}

// SvelteKit only resets the window's scroll, but reports scroll inside a layout
// element that outlives navigation, so that element has to be reset here.
export function resetScrollOnNavigate(getViewport: () => HTMLElement | undefined): void {
	afterNavigate((navigation) => {
		if (!shouldResetScroll(navigation)) return;
		// 'instant' overrides the viewport's scroll-smooth, which would animate the jump.
		getViewport()?.scrollTo({ top: 0, behavior: 'instant' });
	});
}
