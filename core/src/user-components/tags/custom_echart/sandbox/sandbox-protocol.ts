import type { LogMessage } from '../../../sandbox/log-protocol';
import {
	isSandboxEnvelope as isEnvelopeOfSource,
	type HeightMessage,
	type ReadyMessage,
	type RenderedMessage,
	type SandboxData,
	type SandboxEnvelope,
	type SandboxFormatSettings,
	type SandboxMode,
	type SandboxThemes
} from '../../../sandbox/protocol-base';

export type { SandboxData, SandboxFormatSettings, SandboxMode, SandboxThemes };

/**
 * Echart-specific sandbox contract: the slice of the protocol that's about
 * ECharts (init payload shape, user-code globals, eval/render error phases).
 * Cross-consumer primitives (envelope, lifecycle messages, data/mode types,
 * log shape, CSP) live in `user-components/sandbox/`.
 *
 * Bump SANDBOX_PROTOCOL_VERSION on any breaking change — both sides assert
 * equality, so a stale cached runtime paired with a new app build fails
 * loudly instead of rendering garbage.
 *
 * v2: adds the `log` message type for forwarding diagnostics into the
 * parent's runtime-errors buffer (consumed by the AI agent's debug_code tool).
 * v3: capture-png moved from a bespoke message pair onto the shared
 * request/response RPC primitive (`rpc-request`/`rpc-response` with kind
 * `'capture-png'`). The wire format changed, so the version bump also
 * cache-busts the runtime URL — a stale v2 bundle can't answer the v3 PNG
 * request and would otherwise silently fail PNG export.
 */
export const SANDBOX_PROTOCOL_VERSION = 3;

/** Per-consumer discriminator so echart and html sandbox traffic don't cross. */
export const SANDBOX_MESSAGE_SOURCE = 'evidence-echart-sandbox';

/** Bound check: validates the envelope AND that this is an echart message. */
export function isSandboxEnvelope(data: unknown): data is SandboxEnvelope {
	return isEnvelopeOfSource(data, SANDBOX_MESSAGE_SOURCE);
}

/**
 * Globals exposed to user code, in the exact order passed to `new Function`.
 * Single source of truth for both the constructor's parameter list and the call
 * arguments, so they can't fall out of sync.
 *
 * Kept intentionally small. Earlier drafts also exposed `rows` (alias of `data`)
 * and `dimensions` (derived from `columns`). Both were dropped because:
 *  - `new Function` parameters are reserved in strict mode — any global name
 *    we expose blocks the author from declaring a local `const` with that
 *    name. `rows` in particular collided constantly because it's the
 *    canonical name for a chart's row array; the agent's natural
 *    `const rows = data.filter(...)` produced a baffling "Cannot declare a
 *    const variable twice" error.
 *  - Both were undocumented in the schema description, so authors didn't
 *    discover them through the API — only by colliding with them.
 *  - Both were trivially derivable from what's exposed (`data` is the row
 *    array; `columns.map(c => c.name)` gives dimensions). Convenience
 *    aliases that lose more (via clashes) than they save.
 *
 * If you add a new global, make sure the name is uncommon as a local
 * variable AND that the description names it.
 */
export const USER_CODE_GLOBAL_NAMES = ['data', 'columns', 'echarts', 'theme', 'fmt'] as const;

// ---- Parent → sandbox ----

export interface InitMessage {
	type: 'init';
	renderer: 'canvas' | 'svg';
	userCode: string;
	data: SandboxData;
	themes: SandboxThemes;
	mode: SandboxMode;
	useCardColors: boolean;
	formatSettings: SandboxFormatSettings;
	printing: boolean;
}

export interface DataMessage {
	type: 'data';
	data: SandboxData;
}

export interface CodeMessage {
	type: 'code';
	userCode: string;
}

export interface ThemeMessage {
	type: 'theme';
	themes?: SandboxThemes;
	mode?: SandboxMode;
	useCardColors?: boolean;
}

export interface ResizeMessage {
	type: 'resize';
	width: number;
	height: number;
}

export type ParentToSandboxMessage =
	| InitMessage
	| DataMessage
	| CodeMessage
	| ThemeMessage
	| ResizeMessage;

// ---- Sandbox → parent ----

export interface SandboxErrorMessage {
	type: 'error';
	phase: 'eval' | 'render';
	message: string;
}

export type SandboxToParentMessage =
	| ReadyMessage
	| RenderedMessage
	| HeightMessage
	| SandboxErrorMessage
	| LogMessage;

// ---- Envelope-bound aliases ----

export type ParentMessage = SandboxEnvelope & ParentToSandboxMessage;
export type SandboxMessage = SandboxEnvelope & SandboxToParentMessage;
