/**
 * Registry connecting iframe DOM elements to their sandbox-frame PNG-capture
 * function. Used by the parent's PNG download path to find sandboxed iframes
 * embedded in the page being exported and request rasterized PNGs from each.
 *
 * Cross-origin iframes can't be captured by html-to-image directly (the
 * clone+rasterize process can't read the iframe's document because of
 * same-origin policy). The workaround is to ask the iframe to rasterize
 * itself (chart.getDataURL for echart, html-to-image-on-its-own-document
 * for the html component) and substitute the resulting PNG as an <img> in place
 * of the iframe before exporting.
 *
 * SandboxFrame components register their iframe element + capture fn on
 * mount and remove on unmount. WeakMap-keyed so a forgotten unregister
 * doesn't leak; iframe GC takes the entry with it.
 */

export type CapturePngFn = (pixelRatio: number) => Promise<string>;

const registry = new WeakMap<HTMLIFrameElement, CapturePngFn>();

export function registerSandboxFrameCapture(iframe: HTMLIFrameElement, fn: CapturePngFn): void {
	registry.set(iframe, fn);
}

export function unregisterSandboxFrameCapture(iframe: HTMLIFrameElement): void {
	registry.delete(iframe);
}

export function getSandboxFrameCapture(iframe: HTMLIFrameElement): CapturePngFn | undefined {
	return registry.get(iframe);
}
