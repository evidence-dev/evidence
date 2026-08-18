/**
 * custom_map sandbox runtime. Bundled to a standalone IIFE by
 * `studio/vite.sandbox-map.config.ts` → `static/sandbox/custom-map-runtime.js`
 * and loaded inside the opaque-origin iframe.
 *
 * MapLibre GL is bundled (BSD-3, keyless default). Mapbox GL is proprietary, so
 * it is never bundled — see `common/mapbox-cdn` — and loads from a CDN only when
 * the resolved provider is Mapbox.
 *
 * Author code runs like a normal `<script>`: it gets the real `mapboxgl` /
 * `maplibregl` globals (Mapbox's access token pre-set), a `container` element,
 * and the `evidence` SDK (query, variables, theme, filters, resize — the
 * write-back filters are what let a map drive a server-side re-query). Plugins
 * like mapbox-gl-draw are normal dynamic imports from a CDN the CSP allows.
 */
import * as maplibregl from 'maplibre-gl';
import { MAPBOX_GL_CSS_URL, loadMapboxGl } from '../../../common/mapbox-cdn';
import { bootSandbox, type SandboxHost } from '../../../sandbox/runtime-bootstrap';
import { errorToLogEntry } from '../../../sandbox/runtime-diagnostics';
import { createMapEvidenceSdk, type MapEvidenceSdk } from './map-evidence-sdk';
import {
	SANDBOX_MESSAGE_SOURCE,
	SANDBOX_PROTOCOL_VERSION,
	type InitMessage,
	type ParentToSandboxMessage,
	type MapProvider,
	type MapThemeSnapshot
} from './sandbox-protocol';

// CSS from the CDN (CSP allows jsdelivr); pinned to the major version in
// core/package.json (maplibre-gl@5).
const MAPLIBRE_CSS = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css';

let host: SandboxHost | undefined;
let sdk: MapEvidenceSdk | undefined;
let resizeObserver: ResizeObserver | undefined;
// Provider/token are fixed for a block's lifetime; stash them so a `code`
// re-render reuses the same provider without re-plumbing the message.
let lastProvider: MapProvider = 'maplibre';
let lastToken: string | undefined;

// Capture safety net. PDF/PNG/screenshot gates on a `rendered` signal, which
// the author fires via evidence.ready() (typically on `map.on('idle')`). If
// they don't — or the map never reaches 'idle' in a headless capture context
// (WebGL not painting, tiles/CDN unreachable) — capture would hang and fail
// rather than degrade. So `markRendered` posts once, whether from the author's
// ready() or from a fallback timer; capture then proceeds with whatever painted.
const RENDER_FALLBACK_MS = 8000;
let renderedPosted = false;
function markRendered(): void {
	if (renderedPosted) return;
	renderedPosted = true;
	host?.post({ type: 'rendered' });
}

function loadCss(href: string): void {
	if (document.querySelector(`link[href="${href}"]`)) return;
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = href;
	document.head.appendChild(link);
}

// Mirror the host theme's surface colors into CSS vars + the body background,
// so author panels/legends using var(--evidence-*) match the host and the
// opaque iframe doesn't flash white. Same var names as the html block.
function applyThemeColors(theme: MapThemeSnapshot): void {
	const root = document.documentElement.style;
	root.setProperty('--evidence-background', theme.background);
	root.setProperty('--evidence-foreground', theme.foreground);
	root.setProperty('--evidence-muted-foreground', theme.mutedForeground);
	root.setProperty('--evidence-border', theme.border);
	if (document.body) document.body.style.backgroundColor = theme.background || 'transparent';
}

function postError(phase: 'load' | 'eval', message: string): void {
	host?.post({ type: 'error', phase, message });
	host?.postLog({ level: 'error', source: 'script', message });
}

/**
 * Wrap a map library so its `Map` constructor defaults `preserveDrawingBuffer:
 * true`. The PNG "generate image" button reads the map via `canvas.toDataURL()`,
 * which returns a BLANK image on a WebGL canvas unless the drawing buffer is
 * preserved. (PDF export uses a page screenshot and doesn't need this.) Default
 * it on so image export works out of the box; an author who wants the small perf
 * win on a heavy map can pass `preserveDrawingBuffer: false` explicitly — their
 * value wins because it's spread after the default.
 */
function wrapMapLib(lib: unknown): unknown {
	const l = lib as { Map?: unknown } | undefined;
	if (!l || typeof l.Map !== 'function') return lib;
	const OrigMap = l.Map as new (options?: Record<string, unknown>) => unknown;
	class Map extends (OrigMap as new (options?: Record<string, unknown>) => object) {
		constructor(options: Record<string, unknown> = {}) {
			super({ preserveDrawingBuffer: true, ...options });
		}
	}
	// Proxy so only `.Map` is swapped; accessToken, controls, etc. pass through.
	return new Proxy(l as object, {
		get: (target, prop) =>
			prop === 'Map' ? Map : (target as Record<string | symbol, unknown>)[prop]
	});
}

/** Load the resolved provider's library, pre-setting Mapbox's token. */
async function loadMapLibrary(
	provider: MapProvider,
	token: string | undefined
): Promise<{ mapboxgl: unknown; mapgl: unknown }> {
	if (provider === 'mapbox') {
		loadCss(MAPBOX_GL_CSS_URL);
		const mapboxgl = await loadMapboxGl(token);
		return { mapboxgl, mapgl: mapboxgl };
	}
	loadCss(MAPLIBRE_CSS);
	return { mapboxgl: undefined, mapgl: maplibregl };
}

// Exact global order handed to `new Function`. Keep in sync with the docs.
const GLOBAL_NAMES = [
	'container',
	'maplibregl',
	'mapboxgl',
	'mapgl',
	'evidence',
	'provider',
	'token'
] as const;

function ensureResizeObserver(): void {
	if (resizeObserver) return;
	resizeObserver = new ResizeObserver(() => {
		const width = document.documentElement.clientWidth;
		const height = document.documentElement.clientHeight;
		// Width 0 during teardown/hidden — don't fire a bogus resize.
		if (width > 0) sdk?.notifyResize({ width, height });
	});
	resizeObserver.observe(document.documentElement);
}

async function runAuthorCode(
	userCode: string,
	provider: MapProvider,
	token: string | undefined
): Promise<void> {
	// Tear down the previous map + drop its subscriptions before re-running.
	sdk?.runTeardown();
	sdk?.reset();

	const root = document.getElementById('evidence-map-root');
	if (!root) {
		postError('load', 'map container missing');
		return;
	}
	root.innerHTML = '';
	const container = document.createElement('div');
	container.style.width = '100%';
	container.style.height = '100%';
	root.appendChild(container);

	let lib: Awaited<ReturnType<typeof loadMapLibrary>>;
	try {
		lib = await loadMapLibrary(provider, token);
	} catch (error) {
		postError('load', `Failed to load the ${provider} library: ${String(error)}`);
		return;
	}

	// Wrap so `new mapgl.Map(...)` gets preserveDrawingBuffer by default (PNG
	// export). Wrap each lib once and reuse, so `mapgl === mapboxgl` still holds.
	const wMaplibre = wrapMapLib(maplibregl);
	const wMapbox = lib.mapboxgl ? wrapMapLib(lib.mapboxgl) : undefined;
	const wActive = provider === 'mapbox' ? wMapbox : wMaplibre;
	const globalValues = [container, wMaplibre, wMapbox, wActive, sdk?.evidence, provider, token];

	try {
		// Async IIFE so top-level `await` works and author `const`s stay local.
		const body = `"use strict";\nreturn (async () => {\n${userCode}\n})();`;
		const fn = new Function(...GLOBAL_NAMES, body);
		await fn(...globalValues);
	} catch (error) {
		postError('eval', error instanceof Error ? error.message : String(error));
		return;
	}

	// Deliberately do NOT post `rendered` here. A map's tiles stream in AFTER the
	// author's synchronous setup returns, so auto-completing now would let PDF/PNG
	// capture a blank/half-loaded frame. Instead the author calls evidence.ready()
	// once the map has painted (e.g. `map.on('idle', () => evidence.ready())`);
	// SandboxFrame's timeout backstops if they never do. (Same rule the html block
	// uses for script content.)
}

bootSandbox<InitMessage>({
	source: SANDBOX_MESSAGE_SOURCE,
	version: SANDBOX_PROTOCOL_VERSION,
	onInit(init, h) {
		host = h;
		lastProvider = init.provider;
		lastToken = init.token;
		applyThemeColors(init.theme);
		// Route the SDK's evidence.ready() through markRendered so the author's
		// signal and the fallback timer coordinate (post 'rendered' exactly once).
		const renderAwareHost: SandboxHost = {
			post: (m) => (m.type === 'rendered' ? markRendered() : h.post(m)),
			postLog: h.postLog,
			request: h.request
		};
		sdk = createMapEvidenceSdk(renderAwareHost, init);
		ensureResizeObserver();
		void runAuthorCode(init.userCode, init.provider, init.token);
		// Backstop: signal completion even if the author never calls ready().
		setTimeout(markRendered, RENDER_FALLBACK_MS);
	},
	onMessage(message, h) {
		host = h;
		const typed = message as unknown as ParentToSandboxMessage;
		if (typed.type === 'state-change') {
			applyThemeColors(typed.theme);
			sdk?.applyState({
				variables: typed.variables,
				theme: typed.theme,
				filters: typed.filters
			});
			return;
		}
		if (typed.type === 'code' && typeof typed.userCode === 'string') {
			void runAuthorCode(typed.userCode, lastProvider, lastToken);
		}
	},
	onCapturePng() {
		const canvas = document.querySelector<HTMLCanvasElement>('#evidence-map-root canvas');
		if (!canvas) throw new Error('map not ready — cannot capture');
		// Mapbox/MapLibre need preserveDrawingBuffer:true for a non-blank readback;
		// authors who want PNG export set it in their Map options.
		return canvas.toDataURL('image/png');
	}
});

window.addEventListener('error', (event) => {
	postError('eval', event.message || 'Uncaught error in map code');
	host?.postLog(errorToLogEntry(event.error ?? event.message));
});
