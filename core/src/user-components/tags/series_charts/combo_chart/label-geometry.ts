import type { ECharts } from 'echarts';

/**
 * Label geometry read from a rendered chart, plus the layout rules every chart
 * must satisfy: no two labels overlap, and no label is cut off by the
 * container. Boxes come from ECharts' own element tree (the text elements it
 * painted, with their final transforms), so the same check works on an SSR
 * render in Node and on a live chart in the browser.
 */

export type LabelKind = 'x' | 'y' | 'data' | 'title';

export interface LabelBox {
	kind: LabelKind;
	text: string;
	/** Corners of the label's box in container pixels (rotation applied). */
	corners: [number, number][];
}

export interface LabelGeometry {
	width: number;
	height: number;
	plot: { x: number; y: number; width: number; height: number };
	labels: LabelBox[];
}

type Matrix = number[] | null | undefined;
type Rect = { x: number; y: number; width: number; height: number };
type TextElement = {
	type: string;
	parent?: TextElement;
	ignore?: boolean;
	invisible?: boolean;
	style?: { text?: string; opacity?: number };
	__hostTarget?: unknown;
	getBoundingRect: () => Rect;
	getComputedTransform: () => Matrix;
};
type ChartInternals = {
	getZr: () => { storage: { getDisplayList: (update?: boolean) => TextElement[] } };
	getModel: () => {
		getComponent: (
			type: string,
			index: number
		) => { coordinateSystem?: { getRect: () => Rect } } | undefined;
	};
};

const transformPoint = (m: Matrix, x: number, y: number): [number, number] =>
	m ? [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]] : [x, y];

/**
 * Every visible text element in the chart, grouped by its owning text (a
 * two-line label is one box) and classified by what it labels.
 */
export function extractLabelGeometry(chart: ECharts, opts: { title?: string } = {}): LabelGeometry {
	const internals = chart as unknown as ChartInternals;
	const plot = internals.getModel().getComponent('grid', 0)?.coordinateSystem?.getRect() ?? {
		x: 0,
		y: 0,
		width: chart.getWidth(),
		height: chart.getHeight()
	};
	const plotBottom = plot.y + plot.height;

	const texts = new Set<TextElement>();
	for (const el of internals.getZr().storage.getDisplayList(true)) {
		if (el.type !== 'tspan' || el.invisible || el.style?.opacity === 0) continue;
		// Plain-text labels paint one tspan per line under a parent text element.
		texts.add(el.parent?.type === 'text' ? el.parent : el);
	}

	const labels: LabelBox[] = [];
	for (const el of texts) {
		const text = el.style?.text;
		if (!text || el.ignore || el.invisible) continue;
		const r = el.getBoundingRect();
		if (r.width <= 0 || r.height <= 0) continue;
		const m = el.getComputedTransform();
		const corners = [
			transformPoint(m, r.x, r.y),
			transformPoint(m, r.x + r.width, r.y),
			transformPoint(m, r.x + r.width, r.y + r.height),
			transformPoint(m, r.x, r.y + r.height)
		];
		const top = Math.min(...corners.map(([, y]) => y));
		const kind: LabelKind =
			el.__hostTarget !== undefined
				? 'data'
				: opts.title !== undefined && text === opts.title
					? 'title'
					: top >= plotBottom - 1
						? 'x'
						: 'y';
		labels.push({ kind, text, corners });
	}

	return { width: chart.getWidth(), height: chart.getHeight(), plot, labels };
}

// Separating-axis test for two convex quads. `slack` lets boxes kiss.
function quadsOverlap(a: [number, number][], b: [number, number][], slack: number): boolean {
	for (const quad of [a, b]) {
		for (let i = 0; i < quad.length; i++) {
			const [x1, y1] = quad[i];
			const [x2, y2] = quad[(i + 1) % quad.length];
			const len = Math.hypot(x2 - x1, y2 - y1);
			if (len === 0) continue;
			const nx = -(y2 - y1) / len;
			const ny = (x2 - x1) / len;
			const project = (q: [number, number][]) => q.map(([x, y]) => x * nx + y * ny);
			const pa = project(a);
			const pb = project(b);
			if (
				Math.min(...pa) + slack >= Math.max(...pb) ||
				Math.min(...pb) + slack >= Math.max(...pa)
			) {
				return false;
			}
		}
	}
	return true;
}

/** Overlap tolerance in px — sub-pixel kisses from rounding aren't visible collisions. */
const OVERLAP_SLACK_PX = 1;
/** Cutoff tolerance in px: SSR text boxes run up to 4px larger than a browser's. */
const EDGE_SLACK_PX = 4;

/**
 * Every layout rule the label geometry breaks, as human-readable strings
 * (empty when the chart is clean).
 */
export function findLabelViolations(geometry: LabelGeometry): string[] {
	const violations: string[] = [];
	const { labels, width, height } = geometry;
	const name = (l: LabelBox) => `${l.kind} "${l.text.replaceAll('\n', '⏎')}"`;

	for (let i = 0; i < labels.length; i++) {
		for (let j = i + 1; j < labels.length; j++) {
			if (quadsOverlap(labels[i].corners, labels[j].corners, OVERLAP_SLACK_PX)) {
				violations.push(`overlap: ${name(labels[i])} ⟷ ${name(labels[j])}`);
			}
		}
	}

	for (const l of labels) {
		const xs = l.corners.map(([x]) => x);
		const ys = l.corners.map(([, y]) => y);
		if (
			Math.min(...xs) < -EDGE_SLACK_PX ||
			Math.max(...xs) > width + EDGE_SLACK_PX ||
			Math.min(...ys) < -EDGE_SLACK_PX ||
			Math.max(...ys) > height + EDGE_SLACK_PX
		) {
			violations.push(
				`cutoff: ${name(l)} at x ${Math.min(...xs).toFixed(0)}–${Math.max(...xs).toFixed(0)}, y ${Math.min(...ys).toFixed(0)}–${Math.max(...ys).toFixed(0)} in ${width}×${height}`
			);
		}
	}

	return violations;
}
