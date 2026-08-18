import {
	isSandboxEnvelope as isEnvelopeOfSource,
	type SandboxEnvelope,
	type SandboxMode
} from '../../../sandbox/protocol-base';

export type { SandboxMode };

/**
 * custom_map-specific sandbox contract. Cross-consumer primitives (envelope,
 * lifecycle messages, log shape, RPC) live in `user-components/sandbox/`.
 *
 * Bump SANDBOX_PROTOCOL_VERSION on any breaking change to the messages below —
 * both sides assert equality, and the runtime URL is `?v=` cache-busted with
 * it, so a stale cached bundle fails loudly instead of rendering garbage.
 *
 * v2: added the reactivity layer (variables / theme / filters in init, the
 *     `state-change` push, and `filter-set` / `filter-create` write-back),
 *     mirroring the html block so a map can drive a server-side re-query.
 * v3: theme snapshot carries resolved surface colors, mirrored into
 *     `--evidence-*` CSS vars so author panels/legends match the host theme.
 */
export const SANDBOX_PROTOCOL_VERSION = 3;

/** Per-consumer discriminator so map / echart / html sandbox traffic never crosses. */
export const SANDBOX_MESSAGE_SOURCE = 'evidence-custom-map-sandbox';

/** Bound check: validates the envelope AND that this is a custom_map message. */
export function isSandboxEnvelope(data: unknown): data is SandboxEnvelope {
	return isEnvelopeOfSource(data, SANDBOX_MESSAGE_SOURCE);
}

export type MapProvider = 'mapbox' | 'maplibre';

/** Values from the tag's `variables={…}` attribute (primitive-only; postMessage-serializable). */
export type MapVariables = Record<string, string | number | boolean | null | undefined>;

/** Theme info exposed as `evidence.theme` — pick a light/dark basemap from `mode`. */
export interface MapThemeSnapshot {
	mode: SandboxMode;
	/** Categorical color palette (the resolved theme's default series colors). */
	palette: string[];
	// Resolved surface colors, mirrored by the runtime into `--evidence-*` CSS
	// vars so author panels/legends can use `var(--evidence-background)` etc. and
	// match the host theme (a `sandbox="allow-scripts"` iframe paints opaque, so
	// without these a `var()` with no value renders transparent).
	background: string;
	foreground: string;
	mutedForeground: string;
	border: string;
}

/** Filter id → value snapshot, exposed via `evidence.filters.get()`. */
export type MapFiltersSnapshot = Record<string, unknown>;

/**
 * Sent once at handshake. `provider` + `token` are resolved by the parent
 * (`resolveMapProvider`) — the sandbox never sees env.
 */
export interface InitMessage {
	type: 'init';
	/** The author's map JavaScript (tag body). */
	userCode: string;
	provider: MapProvider;
	/** Mapbox access token (Evidence's or the author's). Absent for MapLibre. */
	token?: string;
	variables: MapVariables;
	theme: MapThemeSnapshot;
	filters: MapFiltersSnapshot;
	printing: boolean;
}

/** Parent → sandbox: page state (variables / theme / filters) changed. */
export interface StateChangeMessage {
	type: 'state-change';
	variables: MapVariables;
	theme: MapThemeSnapshot;
	filters: MapFiltersSnapshot;
}

/** Parent → sandbox: the author edited the body — tear down and re-run. */
export interface CodeMessage {
	type: 'code';
	userCode: string;
}

export type ParentToSandboxMessage = StateChangeMessage | CodeMessage;

/** Sandbox → parent: visual error overlay (separate from the log pipeline). */
export interface SandboxErrorMessage {
	type: 'error';
	phase: 'load' | 'eval';
	message: string;
}

/**
 * Pull-model data (mirrors the html block): author calls `evidence.query(name)`
 * → RPC `MAP_QUERY_REQUEST` → the parent resolves the named page query.
 */
export const MAP_QUERY_REQUEST = 'query';

export interface MapQueryRequest {
	name: string;
}

export interface MapQueryResponse {
	rows: Record<string, unknown>[];
}

/** Sandbox → parent: `evidence.filters.set(id, value)`. */
export interface FilterSetMessage {
	type: 'filter-set';
	id: string;
	value: unknown;
}

/** Sandbox → parent: `evidence.filters.create(id, value, { column })`. */
export interface FilterCreateMessage {
	type: 'filter-create';
	id: string;
	value: unknown;
	column?: string;
}

// ---- Inbound validators (sandbox → parent) ----
// The runtime bundle is the only producer, but we validate at the boundary
// because `column` flows into a SQL predicate — a malformed value is an
// injection vector we close here regardless of the producer.

const SQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_$]*(?:\.[A-Za-z_][A-Za-z0-9_$]*)*$/;

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

export function validateFilterSetMessage(message: unknown): FilterSetMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'filter-set') return null;
	if (!isNonEmptyString(m.id)) return null;
	return { type: 'filter-set', id: m.id, value: m.value };
}

export function validateFilterCreateMessage(message: unknown): FilterCreateMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'filter-create') return null;
	if (!isNonEmptyString(m.id)) return null;
	let column: string | undefined;
	if (m.column !== undefined) {
		if (typeof m.column !== 'string' || !SQL_IDENTIFIER_PATTERN.test(m.column)) return null;
		column = m.column;
	}
	return column !== undefined
		? { type: 'filter-create', id: m.id, value: m.value, column }
		: { type: 'filter-create', id: m.id, value: m.value };
}
