/**
 * Cross-consumer protocol primitives — shapes and helpers that every
 * sandboxed component (custom_echart and html) speaks identically.
 *
 * Consumer-specific pieces (the message-source discriminator, the protocol
 * version, the init/data/theme payload shapes, the runtime path) live in
 * each tag's own `sandbox-protocol.ts`. This module holds only what is
 * genuinely the same across all consumers.
 */
import type { AnyRowType, Column } from '../interfaces/query-service';
import type { Theme } from '../../types/theme';

/** Display mode the parent threads through to the sandbox. */
export type SandboxMode = 'light' | 'dark';

/** The query-result slice that crosses into a sandbox (structured-cloned). */
export interface SandboxData {
	rows: AnyRowType[];
	columns: Column[];
}

/**
 * Theme pair (light + dark) made available inside the sandbox. The opaque
 * origin can't reach the parent's reactive theme store, so the parent
 * snapshots both palettes and the sandbox reads the one matching
 * SandboxMode. Any sandbox that lets user code style output wants this.
 */
export interface SandboxThemes {
	light: Theme;
	dark: Theme;
}

/**
 * Settings `formatValue` (Evidence's `fmt()`) normally reads from app-module
 * globals (`getDecimalSeparator`). The opaque-origin sandbox has no access to
 * those, so the parent threads them in. Any sandbox exposing `fmt()` to user
 * code wants this — defer to the consumer whether to actually expose `fmt`.
 */
export interface SandboxFormatSettings {
	decimalSeparator?: '.' | ',';
	firstDayOfWeek?: 'sunday' | 'monday';
}

/**
 * Common envelope wrapping every message in both directions. `source` is a
 * per-consumer discriminator (e.g. 'evidence-echart-sandbox',
 * 'evidence-html-sandbox') so listeners can ignore unrelated postMessage
 * traffic, including messages from a sibling sandbox of another type.
 * `instanceId` distinguishes multiple frames of the same consumer on one page.
 */
export interface SandboxEnvelope {
	source: string;
	v: number;
	instanceId: string;
}

/**
 * Cheap discriminator check for inbound postMessage data. Each consumer
 * passes its own `expectedSource` so a message from one sandbox type
 * doesn't accidentally pass another's check. Callers must still verify
 * the protocol version (`v`) and narrow on `type` themselves — identity
 * (which iframe) is enforced separately via the dedicated MessageChannel
 * port + `event.source`, since opaque-origin frames report
 * `event.origin === "null"`.
 */
export function isSandboxEnvelope(data: unknown, expectedSource: string): data is SandboxEnvelope {
	return (
		typeof data === 'object' &&
		data !== null &&
		(data as { source?: unknown }).source === expectedSource
	);
}

// ---- Lifecycle messages (every sandbox sends these regardless of payload) ----

export interface ReadyMessage {
	type: 'ready';
}

export interface RenderedMessage {
	type: 'rendered';
}

export interface HeightMessage {
	type: 'height';
	contentHeight: number;
}

// ---- Inbound message validators ----
//
// The channel between iframe and parent is a transferred MessagePort and the
// iframe is sandboxed, so well-formed runtime code is the only thing that
// should ever produce these. Validate at the boundary anyway: a compromised
// runtime bundle, AI-generated author code that constructs bad postMessage
// envelopes by mistake, or a future channel-widening refactor are all
// scenarios where a malformed payload silently coerced into a layout calc
// or diagnostics buffer is the kind of thing security review correctly
// flags. Validators return null on shape failure (caller logs + drops);
// authoritative narrowing returns a typed message on success.

/**
 * Narrow an unknown inbound message to a HeightMessage with a finite,
 * non-negative `contentHeight`. Negative / `Infinity` / `NaN` / string
 * heights would propagate into CSS `min-height` and break layout silently;
 * we drop them instead.
 */
export function validateHeightMessage(message: unknown): HeightMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'height') return null;
	const h = m.contentHeight;
	if (typeof h !== 'number' || !Number.isFinite(h) || h < 0) return null;
	return { type: 'height', contentHeight: h };
}

// ---- PNG capture (cross-consumer) ----
//
// The parent's PNG download path (html-to-image) can't see inside cross-origin
// iframes — the chart drawing is invisible to the cloning rasterizer. Each
// sandboxed runtime exposes a way to rasterize its OWN contents to a PNG data
// URL (custom_echart via ECharts' chart.getDataURL, html via
// html-to-image on its own document.body — both same-origin from within the
// iframe). The parent requests this over the generic request/response channel
// (`request-response.ts`) with kind `'capture-png'` and payload
// `{ pixelRatio }`; the runtime registers the matching handler (wired from
// `bootSandbox`'s `onCapturePng`). The reply's `result` is the data URL, which
// the parent substitutes into an `<img>` over the iframe before calling toPng.
//
// There is no dedicated capture-png message type any more — it rides the same
// correlated RPC primitive as every other sandbox request.
