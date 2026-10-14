import { getContext, setContext } from 'svelte';
import { IsMobile } from './shadcn/hooks/is-mobile.svelte';

const PREVIEW_VIEWPORT_KEY = Symbol('preview-viewport');

export type PreviewViewport = {
	mobile: boolean;
	portalTarget?: HTMLElement | null;
};

// The editor's mobile preview narrows a container, not the window, so viewport media queries can't see it.
export function setPreviewViewportContext(get: () => PreviewViewport) {
	setContext(PREVIEW_VIEWPORT_KEY, get);
}

export class Viewport {
	#preview = getContext<(() => PreviewViewport) | undefined>(PREVIEW_VIEWPORT_KEY);
	#media: IsMobile;

	constructor(breakpoint?: number) {
		this.#media = new IsMobile(breakpoint);
	}

	get simulatingMobile() {
		return this.#preview?.().mobile ?? false;
	}

	get isMobile() {
		return this.simulatingMobile || this.#media.current;
	}

	/** Where overlays should portal; undefined keeps the default (body). */
	get portalTo() {
		return this.simulatingMobile ? (this.#preview?.().portalTarget ?? undefined) : undefined;
	}
}
