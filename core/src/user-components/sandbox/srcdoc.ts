/**
 * Builds the locked-down `srcdoc` HTML used by every sandboxed component.
 * Each consumer passes its own runtime URL and body mount markup. The
 * document scaffold and the DEFAULT CSP live here so custom_echart and any
 * future sandbox tag share one baseline security model. A consumer may pass
 * its own `csp` when it legitimately needs a different policy (e.g. the html
 * block allowing allowlisted CDN scripts) — but the opaque-origin +
 * no-same-origin isolation enforced by the iframe element is non-negotiable
 * and independent of the CSP.
 *
 * Threat model: the iframe is `sandbox="allow-scripts"` WITHOUT
 * `allow-same-origin`, so it runs at an opaque origin (no parent cookie/DOM
 * access, no self-unsandbox). On that frame, CSP `'self'` matches nothing,
 * which is why `script-src` must name the concrete origin the bundle is
 * served from. `connect-src 'none'` + remote-free `img-src` close network
 * egress so author code can compute and render but cannot exfiltrate the
 * data it's handed.
 *
 * `frame-ancestors` and `sandbox` can't be set via meta and don't need to
 * be: srcdoc has no URL to be independently framed or navigated to, and
 * the sandbox attribute is enforced by the iframe element itself.
 *
 * ## Srcdoc invariance contract (applies to EVERY input on this function)
 *
 * Every value embedded in srcdoc is bootloader state. The browser reloads
 * the iframe whenever the `srcdoc` attribute changes, with no acknowledgement
 * back to the parent, destroying every in-iframe state (SDK, DOM, message
 * port). The parent has no native hook to know it needs to re-handshake.
 *
 * Therefore: srcdoc must be a pure function of values that DO NOT CHANGE
 * for the iframe's lifetime. Anything that can legitimately change while
 * the user is on the page — content, theme, filters, dimensions, mode,
 * variables — must flow through the init payload (first delivery) and
 * post-handshake channel messages (updates), NOT through srcdoc.
 *
 * The one acknowledged exception is `initialBackgroundColor`, which affects
 * the iframe's first paint before any init message can arrive. The consumer
 * snapshots it at iframe creation with `untrack` and never updates it
 * thereafter; the runtime takes over via `theme` messages after handshake.
 * The same exception applies to `bodyHtml`: consumers may pin reactive
 * inputs at first compute, but anything that needs to change later MUST
 * NOT influence srcdoc.
 *
 * `SandboxFrame.svelte` enforces this by `untrack`-ing both `bodyHtml` and
 * `initialBackgroundColor` so a future regression where a consumer derives
 * one of these from reactive state cannot silently force iframe reloads.
 */

export interface BuildSandboxSrcdocOptions {
	/** Absolute origin serving the runtime bundle (typically `window.location.origin`). */
	origin: string;
	/** Full URL to the consumer's runtime script, version-pinned by the consumer. */
	runtimeUrl: string;
	/**
	 * Markup placed inside `<body>` before the runtime script. Use this for
	 * any mount points the runtime expects (e.g. `<div id="evidence-echart"></div>`)
	 * AND for static `<style>` rules the runtime later toggles via classes
	 * on `<body>` (e.g. autosize vs fixed dimension modes).
	 *
	 * MUST be invariant for the iframe's lifetime — see the srcdoc invariance
	 * contract above. SandboxFrame.svelte pins this value with `untrack` so a
	 * reactive bodyHtml accidentally derived from changing state cannot force
	 * iframe reloads. If you need runtime-conditional behavior, encode every
	 * variant in this string and toggle a class from the iframe runtime.
	 */
	bodyHtml?: string;
	/**
	 * Background color to paint on the iframe body on first frame. Without
	 * this, the iframe paints the browser default (white) until the runtime
	 * loads and applies its own bg — producing a visible flash on every
	 * chart load, especially in dark mode where the contrast is loud.
	 *
	 * Consumers compute this from their resolved theme (the same value
	 * getThemeToken would produce for a host-rendered chart at the same
	 * position) and pass it in. The runtime can still update the body bg
	 * later (e.g. on a theme message) — this just paints the right color
	 * BEFORE the runtime is alive.
	 */
	initialBackgroundColor?: string;
	/**
	 * Full Content-Security-Policy string for the iframe document. Omit to use
	 * the locked-down default (see `buildDefaultSandboxCsp`), which is what
	 * `custom_echart` uses. Consumers that legitimately need a different policy
	 * — e.g. the html block allowing allowlisted CDN scripts, or an opt-in
	 * network tier — pass their own here. The opaque-origin + no-same-origin
	 * isolation is enforced by the iframe element regardless; this only governs
	 * what the author's own code can load/reach.
	 */
	csp?: string;
}

/**
 * The default locked-down CSP. Opaque-origin frame, so `'self'` matches
 * nothing — `script-src` names the concrete bundle origin. `connect-src 'none'`
 * + remote-free `img-src` close network egress so author code can compute and
 * render but cannot exfiltrate the data it's handed.
 */
export function buildDefaultSandboxCsp(origin: string): string {
	return [
		`default-src 'none'`,
		`script-src ${origin} 'unsafe-eval'`,
		`style-src 'unsafe-inline'`,
		`img-src data: blob:`,
		`font-src ${origin} data:`,
		`connect-src 'none'`,
		`worker-src 'none'`,
		`child-src 'none'`,
		`frame-src 'none'`,
		`base-uri 'none'`,
		`form-action 'none'`
	].join('; ');
}

export function buildSandboxSrcdoc({
	origin,
	runtimeUrl,
	bodyHtml = '',
	initialBackgroundColor = 'transparent',
	csp
}: BuildSandboxSrcdocOptions): string {
	// Sanitize the bg color before interpolating into the style block. We only
	// allow simple CSS color tokens: hex (#rgb/#rrggbb/#rrggbbaa), rgb(a),
	// hsl(a), CSS color names, or 'transparent'. Anything else falls back to
	// 'transparent' rather than embedding raw input into the document.
	const safeBg = /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([^)]+\)|transparent|[a-z]+)$/i.test(
		initialBackgroundColor
	)
		? initialBackgroundColor
		: 'transparent';
	const resolvedCsp = csp ?? buildDefaultSandboxCsp(origin);

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="${resolvedCsp}" />
<style>
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: ${safeBg}; }
</style>
</head>
<body>
${bodyHtml}
<script src="${runtimeUrl}"></script>
</body>
</html>`;
}
