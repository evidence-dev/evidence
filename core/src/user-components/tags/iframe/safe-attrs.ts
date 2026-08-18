// Author-written `attrs` is spread onto the element sanitizeUrl just cleaned, so `src` would
// override the sanitized value and `srcdoc` runs HTML in our origin with no URL at all.
const UNSAFE_ATTR = /^(src|srcdoc)$/i;

export function safeIframeAttrs(attrs: unknown): Record<string, unknown> {
	if (!attrs || typeof attrs !== 'object') return {};
	return Object.fromEntries(
		Object.entries(attrs as Record<string, unknown>).filter(([key]) => !UNSAFE_ATTR.test(key))
	);
}
