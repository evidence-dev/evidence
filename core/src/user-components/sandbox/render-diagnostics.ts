// Lets production logs tell a mis-sized or unpainted blank chart apart from one that never booted.

export type SandboxDiagnosticsPhase = 'rendered' | 'settled' | 'timeout';

export type SandboxDiagnosticsMetrics = Record<string, string | number | boolean | null>;

export interface SandboxDiagnosticsMessage {
	type: 'diag';
	phase: Exclude<SandboxDiagnosticsPhase, 'timeout'>;
	metrics: SandboxDiagnosticsMetrics;
}

export interface SandboxDiagnosticsReport {
	component: string;
	phase: SandboxDiagnosticsPhase;
	/** Non-empty when the snapshot looks like a blank or mis-sized chart. */
	anomaly: string;
	/** The iframe element's size as the parent lays it out. */
	frameWidth: number | null;
	frameHeight: number | null;
	metrics: SandboxDiagnosticsMetrics;
}

const MAX_METRICS = 30;
const MAX_STRING_LENGTH = 300;
const MESSAGE_PHASES = new Set(['rendered', 'settled']);

/** Drop anything that isn't a small bag of primitives; the runtime is the only producer. */
export function validateDiagnosticsMessage(message: unknown): SandboxDiagnosticsMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'diag' || typeof m.phase !== 'string' || !MESSAGE_PHASES.has(m.phase)) {
		return null;
	}
	if (!m.metrics || typeof m.metrics !== 'object' || Array.isArray(m.metrics)) return null;
	const entries = Object.entries(m.metrics as Record<string, unknown>);
	if (entries.length > MAX_METRICS) return null;
	const metrics: SandboxDiagnosticsMetrics = {};
	for (const [key, value] of entries) {
		if (value === null || typeof value === 'boolean') metrics[key] = value;
		else if (typeof value === 'number') metrics[key] = Number.isFinite(value) ? value : null;
		else if (typeof value === 'string') metrics[key] = value.slice(0, MAX_STRING_LENGTH);
		else return null;
	}
	return { type: 'diag', phase: m.phase as SandboxDiagnosticsMessage['phase'], metrics };
}

type Sink = (report: SandboxDiagnosticsReport) => void;
let sink: Sink | undefined;

export function setSandboxDiagnosticsSink(next: Sink | undefined): void {
	sink = next;
}

export function reportSandboxDiagnostics(report: SandboxDiagnosticsReport): void {
	try {
		sink?.(report);
	} catch {
		/* never let telemetry break a chart */
	}
}

const SIZE_TOLERANCE_PX = 2;

const differs = (a: number, b: number): boolean => Math.abs(a - b) > SIZE_TOLERANCE_PX;

export function classifySurface(surface: {
	boxWidth: number;
	boxHeight: number;
	drawnWidth: number;
	drawnHeight: number;
	painted: number | null;
}): string {
	const { boxWidth, boxHeight, drawnWidth, drawnHeight, painted } = surface;
	if (boxWidth === 0 || boxHeight === 0) return 'box-zero';
	if (drawnWidth === 0 || drawnHeight === 0) return 'drawn-zero';
	if (differs(boxWidth, drawnWidth) || differs(boxHeight, drawnHeight)) return 'size-mismatch';
	if (painted === 0) return 'nothing-painted';
	return '';
}

/** Sample a 2D canvas's alpha channel; null if it can't be read (e.g. WebGL). */
export function countPaintedPixels(canvas: HTMLCanvasElement): number | null {
	if (!canvas.width || !canvas.height) return 0;
	try {
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		let painted = 0;
		for (let i = 3; i < pixels.length; i += 400) if (pixels[i] > 0) painted++;
		return painted;
	} catch {
		return null;
	}
}
