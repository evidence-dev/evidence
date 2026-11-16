import type { Filters } from '../../Filters.svelte';
import type { OutlineMode, OutlineSection } from '../../print-outline/resolve-outline';

export type ResolveRendererOutline = (mode: OutlineMode) => Promise<OutlineSection[]>;

// Associates each rendered `[data-markdoc-content]` root with an outline resolver bound to its
// tree and page contexts, so consumers outside the page's context tree (PdfSettingsModal in a
// layout, the TOC) can read the full outline — including content not mounted in the DOM —
// without prop-drilling.
const outlinesByRoot = new WeakMap<HTMLElement, ResolveRendererOutline>();
const pageFiltersByRoot = new WeakMap<HTMLElement, Filters>();

export function registerRendererOutline(el: HTMLElement, resolve: ResolveRendererOutline): void {
	outlinesByRoot.set(el, resolve);
}

export function getRendererOutline(el: HTMLElement): ResolveRendererOutline | undefined {
	return outlinesByRoot.get(el);
}

export function registerRendererPageFilters(el: HTMLElement, filters: Filters | undefined): void {
	if (filters) pageFiltersByRoot.set(el, filters);
}

export function getRendererPageFilters(el: HTMLElement): Filters | undefined {
	return pageFiltersByRoot.get(el);
}
