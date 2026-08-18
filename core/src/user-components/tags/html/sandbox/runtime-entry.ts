/**
 * Iframe runtime for the `{% html %}` block. Bundled from the shared manifest
 * (core/src/user-components/sandbox/sandbox-runtimes.js) into each host app's
 * static/sandbox/html-runtime.js and loaded as a classic script inside a
 * `sandbox="allow-scripts"` iframe
 * (opaque origin). Everything here runs UNTRUSTED-adjacent: it injects and
 * executes the report author's HTML+JS, which is why it lives behind the opaque
 * origin + Tier-1 CSP (no network egress) rather than in the app's own realm.
 *
 * Boot order matters: `window.evidence` is installed BEFORE any author script
 * runs, so author code never sees a half-initialized SDK. The body HTML arrives
 * in the init payload (not baked into the srcdoc) precisely so we can populate
 * the SDK first, then inject.
 *
 * Handshake, message routing, console forwarding, and capture-png all come from
 * the shared sandbox/runtime-bootstrap module; this file owns only the
 * html-specific pieces (SDK install, DOM injection, height reporting).
 */
import * as htmlToImage from 'html-to-image';
import { bootSandbox, type SandboxHost } from '../../../sandbox/runtime-bootstrap';
import { errorToLogEntry } from '../../../sandbox/runtime-diagnostics';
import {
	HTML_SANDBOX_MESSAGE_SOURCE,
	HTML_SANDBOX_PROTOCOL_VERSION,
	type HtmlInitMessage,
	type HtmlThemeSnapshot,
	type ParentToHtmlMessage
} from './html-protocol';
import { createEvidenceSdk, type EvidenceSdk } from './evidence-sdk';
import { htmlHasScript, injectAndRun } from './inject-html';
import { TIER_1_CDN_ORIGINS } from './html-csp';
import type { HtmlMode } from './html-protocol';
import {
	installAuthorSideEffectTracker,
	type AuthorSideEffectTracker
} from './author-side-effects';

const HEIGHT_REPORT_THRESHOLD_PX = 2;

let host: SandboxHost | undefined;
let sdk: EvidenceSdk | undefined;
let authorEffects: AuthorSideEffectTracker | undefined;
let injected = false;
let lastReportedHeight = -1;
let lastNotifiedWidth = -1;
let reportedFixedClip = false;

function reportHeight(): void {
	// Measure the body's content box, NOT documentElement.scrollHeight: the
	// latter is clamped to the current viewport, so once the iframe has grown it
	// never reports a smaller value and the block can't shrink back to fit
	// trimmed content. body height is `auto` in autosize mode, so its rect IS the
	// content height (grows AND shrinks). In fixed mode (`height=`) the parent
	// ignores this value, so reporting the pinned height here is harmless.
	if (!document.body) return;
	const height = Math.ceil(document.body.getBoundingClientRect().height);
	if (Math.abs(height - lastReportedHeight) < HEIGHT_REPORT_THRESHOLD_PX) return;
	lastReportedHeight = height;
	host?.post({ type: 'height', contentHeight: height });
}

// Single observer drives two things: height reporting (parent grows the iframe)
// and the author-facing `evidence.onResize` hook. onResize fires only on WIDTH
// change — height moves as a *consequence* of the author's own redraw, so
// firing onResize on height would risk a redraw→height→onResize→redraw loop.
function watchSize(): void {
	const observer = new ResizeObserver(() => {
		reportHeight();
		checkFixedClip();
		const width = document.documentElement.clientWidth;
		if (width !== lastNotifiedWidth) {
			lastNotifiedWidth = width;
			sdk?.notifyResize({ width, height: document.documentElement.clientHeight });
		}
	});
	observer.observe(document.documentElement);
	if (document.body) observer.observe(document.body);
}

// A sandbox="allow-scripts" iframe doesn't composite transparently in Chromium
// — it paints white regardless of the document's CSS — so paint the body the
// host's resolved background to match the page/card (esp. visible in dark mode).
function applyBodyBackground(background: string | undefined): void {
	if (document.body) document.body.style.backgroundColor = background || 'transparent';
}

// The base stylesheet baked into the srcdoc (see HtmlSandbox's BASE_STYLESHEET)
// styles plain author markup off these vars. We mirror the host's resolved
// surface colors onto :root at RUNTIME — not in the srcdoc — so a project/page
// theme edit or a light/dark toggle updates them live through the state-change
// channel, exactly like applyBodyBackground repaints the background. Author CSS
// still wins: the base rules use :where() (zero specificity).
function applyThemeColors(theme: HtmlThemeSnapshot): void {
	const root = document.documentElement.style;
	root.setProperty('--evidence-background', theme.background);
	root.setProperty('--evidence-foreground', theme.foreground);
	root.setProperty('--evidence-muted-foreground', theme.mutedForeground);
	root.setProperty('--evidence-border', theme.border);
}

// Dimension mode is class-driven: the srcdoc bakes both autosize and fixed
// CSS rules in, and we toggle which set is live by setting a class on body.
// Idempotent so it can run on every state-change without thrash. Carried
// through the channel (NOT srcdoc) so a user editing `height=` mid-session
// is a class toggle, not an iframe reload — see `sandbox/srcdoc.ts`.
function applyMode(mode: HtmlMode): void {
	if (!document.body) return;
	document.body.classList.toggle('evidence-html-autosize', mode === 'autosize');
	document.body.classList.toggle('evidence-html-fixed', mode === 'fixed');
}

// Autosize blocks grow to fit (the parent resizes the iframe to reported
// height), so they can't clip. A FIXED block (`height=`) can't grow, and the
// srcdoc clips overflow rather than scrolling — so content taller than the box
// is silently cut off, and a height that fits on desktop routinely clips at
// mobile width. Surface that ONCE to the diagnostics feed (which the AI agent
// reads) so it's actionable instead of invisible. Re-arms when the clip clears,
// so a later edit that re-introduces it warns again.
function checkFixedClip(): void {
	if (!document.body || !document.body.classList.contains('evidence-html-fixed')) {
		reportedFixedClip = false;
		return;
	}
	const viewport = document.documentElement.clientHeight;
	const content = Math.ceil(document.body.scrollHeight);
	if (viewport <= 0 || content - viewport <= HEIGHT_REPORT_THRESHOLD_PX) {
		reportedFixedClip = false;
		return;
	}
	if (reportedFixedClip) return;
	reportedFixedClip = true;
	host?.postLog({
		level: 'warn',
		source: 'script',
		message: `This {% html %} block has a fixed height= but its content is ${content}px tall, so ~${content - viewport}px is clipped (the block does not scroll). Remove height= to let it grow to fit its content, or increase the height. Fixed heights that fit on desktop often clip at mobile width.`
	});
}

// Mount the author's body and resolve render completion. injectAndRun resolves
// once scripts have STARTED, not finished — a block with scripts may still be
// drawing (CDN import, evidence.query await). Auto-completing then would let
// capture fire on a blank frame (the primary CDN/query use case). So:
//   - No <script>: the HTML is fully rendered the instant it's injected;
//     complete immediately.
//   - Has <script>: defer to the author's evidence.ready() call (the parent's
//     safety timeout releases the frame if they never call it).
async function runBody(html: string): Promise<void> {
	await injectAndRun(html);
	reportHeight();
	checkFixedClip();
	scheduleBlankRenderCheck();
	if (!htmlHasScript(html)) host?.post({ type: 'rendered' });
}

/**
 * One-shot "did anything actually paint?" check a few seconds after
 * injection. A block can reserve its full fixed height and draw NOTHING with
 * zero errors — a D3 draw into a 0-height flex child, a chart appended to
 * the wrong node, an early return — and the author (and debug_code) see a
 * silent void, the worst failure mode for a self-serve feature (GA dry-run
 * finding). The runtime can't know WHY, but it can say THAT: if no visible
 * descendant has meaningful painted area by the deadline, warn through the
 * diagnostics feed with the usual suspects. Worded to be ignorable for the
 * rare legitimately-invisible block.
 */
let blankCheckTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleBlankRenderCheck(): void {
	if (blankCheckTimer !== undefined) clearTimeout(blankCheckTimer);
	blankCheckTimer = setTimeout(() => {
		const root = document.getElementById('evidence-html-root');
		if (!root) return;
		const elements = root.querySelectorAll('*');
		let painted = false;
		let index = 0;
		for (const el of elements) {
			// Bounded scan — a huge DOM that gets this far has painted something.
			if (index++ > 400) {
				painted = true;
				break;
			}
			const rect = el.getBoundingClientRect();
			if (rect.width < 12 || rect.height < 12) continue;
			const tag = el.tagName;
			if (tag === 'SVG' || tag === 'svg' || tag === 'CANVAS' || tag === 'IMG' || tag === 'VIDEO') {
				painted = true;
				break;
			}
			if ((el.textContent ?? '').trim().length > 0) {
				painted = true;
				break;
			}
		}
		if (!painted) {
			// postLog, not console.warn: same diagnostics channel as the
			// fixed-clip check, and it keeps published viewers' consoles clean.
			host?.postLog({
				level: 'warn',
				source: 'script',
				message:
					'html: this block appears to have rendered NOTHING visible (no text, svg, canvas, or image with real size) — the reserved space is empty. Usual causes: drawing into an element whose height computed to 0 (percentage heights inside flex need every ancestor sized — or pass height= on the html tag), appending to the wrong node, or a draw that never ran. If the block is intentionally invisible, ignore this.'
			});
		}
	}, 3000);
}

async function applyInit(init: HtmlInitMessage): Promise<void> {
	// Re-init (parent reconnect) re-seeds reactive state + repaints the bg;
	// never re-injects here — a body edit comes through `html-change` instead.
	if (injected) {
		sdk?.applyState({
			variables: init.variables,
			theme: init.theme,
			filters: init.filters
		});
		applyBodyBackground(init.theme.background);
		applyThemeColors(init.theme);
		applyMode(init.mode);
		return;
	}
	injected = true;

	sdk = createEvidenceSdk(host!, init);
	// Installed before injection so author scripts see a complete SDK.
	(window as unknown as { evidence: EvidenceSdk['evidence'] }).evidence = sdk.evidence;

	// Mode class first so the first paint of author content sizes correctly
	// (body height: auto vs 100% changes how an inserted root div lays out).
	applyMode(init.mode);
	applyBodyBackground(init.theme.background);
	applyThemeColors(init.theme);
	watchSize();
	// Install AFTER our own setup (handshake/error/resize wiring) so only
	// author-registered listeners/timers are tracked for re-inject teardown.
	authorEffects = installAuthorSideEffectTracker(window);
	await runBody(init.html);
}

// Live body edit: tear down the previous render and re-run the new body. The
// SDK is reset (not recreated) so `window.evidence` identity is stable and the
// previous render's subscriptions don't linger; injectAndRun replaces the mount
// contents. Author-added window listeners/timers from the prior body can't be
// reclaimed — a full reset needs a page refresh — but that's the rare case;
// the common edit (markup + a render script) reruns cleanly.
async function reinject(html: string): Promise<void> {
	if (!injected) return;
	// Reclaim the prior body's global side effects (listeners, timers, animation
	// frames) and SDK subscriptions so they don't stack across edits, then re-run.
	authorEffects?.teardown();
	sdk?.reset();
	lastReportedHeight = -1;
	reportedFixedClip = false;
	await runBody(html);
}

bootSandbox<HtmlInitMessage>({
	source: HTML_SANDBOX_MESSAGE_SOURCE,
	version: HTML_SANDBOX_PROTOCOL_VERSION,
	onInit(init, h) {
		host = h;
		void applyInit(init);
	},
	onMessage(message) {
		const typed = message as unknown as ParentToHtmlMessage;
		if (typed.type === 'state-change') {
			sdk?.applyState({
				variables: typed.variables,
				theme: typed.theme,
				filters: typed.filters
			});
			applyBodyBackground(typed.theme.background);
			applyThemeColors(typed.theme);
			applyMode(typed.mode);
		} else if (typed.type === 'html-change') {
			void reinject(typed.html);
		}
	},
	// Parent's PNG export path can't see inside the cross-origin iframe; rasterize
	// our own document.body and hand back a data URL.
	onCapturePng: (pixelRatio) => htmlToImage.toPng(document.body, { pixelRatio })
});

// Surface uncaught author errors (sync throws + rejected promises) to the
// parent's diagnostics feed. bootSandbox forwards console.* but deliberately
// leaves window-level error handling to the consumer.
window.addEventListener('error', (event) =>
	host?.postLog(errorToLogEntry(event.error ?? event.message))
);
window.addEventListener('unhandledrejection', (event) =>
	host?.postLog(errorToLogEntry(event.reason))
);

// CSP blocks (a disallowed CDN, or a fetch/XHR hitting an off-allowlist host)
// fire a `securitypolicyviolation` event and a browser console message that
// does NOT route through the patched console.error — so without this listener
// the failure is invisible to the diagnostics feed and the agent just sees a
// blank frame. Translate it into an explicit, actionable log entry so authors
// (and the AI agent's debug pipeline) know what was blocked and what to do.
//
// Two kinds of noise we deliberately DON'T surface:
//   1. connect-src violations whose target is an allowlisted CDN. These are the
//      browser fetching a sub-resource of a library you legitimately imported
//      via script-src — most commonly a `.map` source map when DevTools is open
//      (esm.sh's d3 pulls ~30 submodules, so that's ~30 benign violations). It
//      is NOT the author exfiltrating data, so flagging it would be misleading.
//   2. Repeats of an identical violation (an animation loop calling fetch every
//      frame would otherwise flood the feed). Report each unique block once.
const reportedCspViolations = new Set<string>();
window.addEventListener('securitypolicyviolation', (event) => {
	const isConnect = event.effectiveDirective?.startsWith('connect-src');
	const blockedURI = event.blockedURI || '';
	// Cross-origin blockedURIs are redacted to just the origin, which is exactly
	// what we compare against — a CDN sub-resource fetch reads as benign here.
	const isAllowlistedCdn = TIER_1_CDN_ORIGINS.some((origin) => blockedURI.startsWith(origin));
	if (isConnect && isAllowlistedCdn) return;

	const dedupeKey = `${event.effectiveDirective}|${blockedURI}`;
	if (reportedCspViolations.has(dedupeKey)) return;
	reportedCspViolations.add(dedupeKey);

	const fix = isConnect
		? 'This host is not on the {% html %} sandbox network allowlist. For your own report data, use evidence.query("query_name") (it never hits the network from inside the iframe). For external data, only a curated set of public hosts is reachable — see the html block docs for the list, or ask the platform team to add a project-level allowlist for the host you need.'
		: `Load libraries only from these CDNs: ${TIER_1_CDN_ORIGINS.join(', ')}. For ES modules use a module script, e.g. <script type="module">import * as d3 from "https://esm.sh/d3@7"</script>.`;
	host?.postLog(
		errorToLogEntry(
			`Blocked by Content-Security-Policy: "${event.blockedURI}" (violated ${event.violatedDirective}). ${fix}`
		)
	);
});
