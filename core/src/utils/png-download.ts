import { toast } from 'svelte-sonner';
import { toPng } from 'html-to-image';
import { getSandboxFrameCapture } from '../user-components/sandbox/png-capture-registry';

export type PngDownloadOptions = {
	filename: string;
	element?: HTMLElement | null;
	selector?: string;
	padding?: number;
};

/**
 * Sandboxed iframes (custom_echart JS-mode, html) live at an
 * opaque origin so html-to-image can't see inside them — the iframe element
 * gets rasterized as a blank rectangle. Workaround: before calling toPng,
 * ask each sandboxed iframe to rasterize ITSELF to a PNG (via the
 * capture-png sandbox protocol) and overlay an <img> on top of the iframe
 * during the capture. The img sits in the same position as the iframe with
 * higher z-index; html-to-image rasterizes both (iframe as its usual blank
 * rectangle, img as the chart), and the img wins visually. Imgs are removed
 * after toPng completes.
 *
 * Critically, the IFRAME stays in the DOM throughout. Removing and
 * re-inserting an iframe makes the browser reload its srcdoc — which
 * destroys the chart instance, re-handshakes, re-loads the runtime
 * bundle, and (user-visible) blanks every chart on the page for ~1s during
 * the export. Overlaying avoids all of that.
 *
 * Per-iframe failures (sandbox not yet rendered, timeout, etc.) skip the
 * overlay for that iframe — html-to-image's blank-rectangle output is the
 * same fallback we'd have without this code, so partial success is fine.
 */
async function withSandboxedIframesReplaced<T>(
	target: HTMLElement,
	pixelRatio: number,
	fn: () => Promise<T>
): Promise<T> {
	const iframes = Array.from(target.querySelectorAll('iframe')).filter(
		(f): f is HTMLIFrameElement => getSandboxFrameCapture(f) !== undefined
	);
	if (iframes.length === 0) return fn();

	const overlays: HTMLImageElement[] = [];

	await Promise.all(
		iframes.map(async (iframe) => {
			const capture = getSandboxFrameCapture(iframe);
			if (!capture) return;
			try {
				const dataUrl = await capture(pixelRatio);
				const img = document.createElement('img');
				img.src = dataUrl;
				// Overlay positioned to match the iframe's bounding box. Insert
				// as an immediate sibling of the iframe and use absolute
				// positioning relative to the iframe's offsetParent. The
				// SandboxFrame wrapper is `position: relative`, so the img sits
				// inside that wrapper aligned with the iframe.
				const parent = iframe.parentElement;
				if (!parent) return;
				// Normalize the parent's position to be a positioning context
				// if it isn't one already. Most callers (SandboxFrame wrapper)
				// already are relative; this is just defense.
				const parentPosition = window.getComputedStyle(parent).position;
				let restoreParentPosition: string | null = null;
				if (parentPosition === 'static') {
					restoreParentPosition = parent.style.position;
					parent.style.position = 'relative';
				}
				const iframeRect = iframe.getBoundingClientRect();
				const parentRect = parent.getBoundingClientRect();
				img.style.position = 'absolute';
				img.style.left = `${iframeRect.left - parentRect.left}px`;
				img.style.top = `${iframeRect.top - parentRect.top}px`;
				img.style.width = `${iframeRect.width}px`;
				img.style.height = `${iframeRect.height}px`;
				img.style.zIndex = '2147483647';
				img.style.pointerEvents = 'none';
				parent.appendChild(img);
				overlays.push(img);
				// Stash the original parent position on the img so we can
				// restore it correctly (don't trample a future-set value).
				if (restoreParentPosition !== null) {
					img.dataset.restoreParentPosition = restoreParentPosition;
				}
			} catch (err) {
				console.warn('[png-download] sandbox capture failed; iframe will appear blank', err);
			}
		})
	);

	try {
		return await fn();
	} finally {
		for (const img of overlays) {
			const parent = img.parentElement;
			if (parent && img.dataset.restoreParentPosition !== undefined) {
				parent.style.position = img.dataset.restoreParentPosition;
			}
			img.remove();
		}
	}
}

function resolveBackgroundColor(target: HTMLElement): string {
	let el: HTMLElement | null = target;
	while (el) {
		const bg = getComputedStyle(el).backgroundColor;
		if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
			return bg;
		}
		el = el.parentElement;
	}
	return document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff';
}

async function withCaptureStyles<T>(target: HTMLElement, fn: () => Promise<T>): Promise<T> {
	const marker = `png-capture-${Math.random().toString(36).slice(2)}`;
	target.setAttribute('data-png-capture', marker);

	const styleEl = document.createElement('style');
	// backdrop-filter renders as a hard-edged blur smear in html-to-image's foreignObject rasterization
	styleEl.textContent = `
		[data-png-capture="${marker}"],
		[data-png-capture="${marker}"] * {
			scrollbar-width: none !important;
			-ms-overflow-style: none !important;
			backdrop-filter: none !important;
			-webkit-backdrop-filter: none !important;
		}
		[data-png-capture="${marker}"]::-webkit-scrollbar,
		[data-png-capture="${marker}"] *::-webkit-scrollbar {
			width: 0 !important;
			height: 0 !important;
			display: none !important;
		}
	`;
	document.head.appendChild(styleEl);
	void target.offsetHeight;

	try {
		return await fn();
	} finally {
		styleEl.remove();
		target.removeAttribute('data-png-capture');
	}
}

export async function downloadPng(options: PngDownloadOptions): Promise<void> {
	if (typeof window === 'undefined' || typeof document === 'undefined') return;

	const selector = options.selector ?? '[data-markdoc-content]';
	const target = options.element ?? document.querySelector<HTMLElement>(selector);

	if (!target) {
		console.error('[png-download] No content element found', { selector });
		toast.error('Could not find report content to capture');
		return;
	}

	const filename = `${options.filename || 'report'}.png`;
	const padding = Math.max(0, options.padding ?? 10);
	const loadingToast = toast.loading('Generating image…', { duration: Infinity });

	try {
		const backgroundColor = resolveBackgroundColor(target);

		const rect = target.getBoundingClientRect();
		const captureWidth = Math.ceil(rect.width) + padding * 2;
		const captureHeight = Math.ceil(rect.height) + padding * 2;

		const pixelRatio = 2;
		const dataUrl = await withCaptureStyles(target, () =>
			withSandboxedIframesReplaced(target, pixelRatio, () =>
				toPng(target, {
					pixelRatio,
					cacheBust: true,
					backgroundColor,
					width: padding > 0 ? captureWidth : undefined,
					height: padding > 0 ? captureHeight : undefined,
					style: padding > 0 ? { padding: `${padding}px`, boxSizing: 'border-box' } : undefined
				})
			)
		);

		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();

		toast.dismiss(loadingToast);
		toast.success('Image downloaded');
	} catch (err) {
		console.error('[png-download] Failed to generate image', err);
		toast.dismiss(loadingToast);
		toast.error('Failed to generate image');
	}
}
