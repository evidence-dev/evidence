import type { DataPoint } from '../../types';

export type WaterfallBarKind = 'increase' | 'decrease' | 'total';

export interface WaterfallStep {
	/** Display label for the bar (x value after formatting). */
	name: string;
	kind: WaterfallBarKind;
	/**
	 * For increase/decrease bars: the change this step contributes.
	 * For total bars: the absolute value the bar is drawn to.
	 */
	value: number;
	/** Running total before this bar. Always 0 for total bars. */
	start: number;
	/** Running total after this bar. */
	end: number;
	/** True when the bar was appended by `total=true`, not present in the data. */
	isComputedTotal: boolean;
	/** Raw values of `tooltip_fields` columns for this row. */
	extras?: Record<string, unknown>;
	/** Secondary line for the tooltip, e.g. the "2023 → 2024" span a breakdown bar belongs to. */
	context?: string;
}

/** Values of the `bar_type` column that mark a row as a total bar (case-insensitive). */
export const TOTAL_BAR_TYPE_VALUES: readonly string[] = ['total', 'subtotal'];

export function isTotalMarker(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	return TOTAL_BAR_TYPE_VALUES.includes(String(value).trim().toLowerCase());
}

export interface BuildWaterfallStepsOptions {
	xColumn: string;
	yColumn: string;
	/** Column whose value marks a row as a total (see `isTotalMarker`). */
	barTypeColumn?: string;
	/** x labels (raw or formatted) whose rows are totals. */
	totals?: readonly string[];
	/** Explicit x order; rows not listed keep their source order after the listed ones. */
	xOrder?: readonly string[];
	/** Append a computed total bar after the last row. */
	appendTotal: boolean;
	totalLabel: string;
	formatName?: (raw: unknown) => string;
	extractExtras?: (row: DataPoint) => Record<string, unknown> | undefined;
}

function toFiniteNumber(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

/** Sort rows by their position in `xOrder`; unlisted rows follow in source order. */
export function applyExplicitOrder<T>(
	rows: readonly T[],
	getLabels: (row: T) => readonly string[],
	xOrder: readonly string[] | undefined
): T[] {
	if (!xOrder || xOrder.length === 0) return [...rows];
	const position = new Map(xOrder.map((label, i) => [label, i]));
	const rank = (row: T): number => {
		for (const label of getLabels(row)) {
			const pos = position.get(label);
			if (pos !== undefined) return pos;
		}
		return Number.POSITIVE_INFINITY;
	};
	return rows
		.map((row, sourceIndex) => ({ row, sourceIndex, rank: rank(row) }))
		.sort((a, b) => a.rank - b.rank || a.sourceIndex - b.sourceIndex)
		.map((r) => r.row);
}

/**
 * Turn query rows into positioned waterfall bars.
 *
 * Every row is a change relative to the running total unless it is marked as a
 * total (via `barTypeColumn` or `totals`), in which case its value is absolute
 * and the running total resets to it. A total row with a null value takes the
 * running total at that point, so an "End" row never has to be computed in SQL.
 */
export function buildWaterfallSteps(
	rows: readonly DataPoint[],
	options: BuildWaterfallStepsOptions
): WaterfallStep[] {
	const formatName = options.formatName ?? ((raw: unknown) => String(raw ?? 'null'));
	const totalLabels = new Set(options.totals ?? []);

	const labelsFor = (row: DataPoint): string[] => {
		const raw = row[options.xColumn];
		const formatted = formatName(raw);
		const rawString = String(raw ?? '');
		return rawString === formatted ? [formatted] : [formatted, rawString];
	};

	const ordered = applyExplicitOrder(rows, labelsFor, options.xOrder);

	const steps: WaterfallStep[] = [];
	let running = 0;

	for (const row of ordered) {
		const labels = labelsFor(row);
		const name = labels[0];
		const markedByColumn =
			options.barTypeColumn !== undefined && isTotalMarker(row[options.barTypeColumn]);
		const markedByList = labels.some((label) => totalLabels.has(label));
		const rawValue = toFiniteNumber(row[options.yColumn]);
		const extras = options.extractExtras?.(row);

		if (markedByColumn || markedByList) {
			const value = rawValue ?? running;
			steps.push({
				name,
				kind: 'total',
				value,
				start: 0,
				end: value,
				isComputedTotal: false,
				extras
			});
			running = value;
			continue;
		}

		const delta = rawValue ?? 0;
		const start = running;
		running += delta;
		steps.push({
			name,
			kind: delta < 0 ? 'decrease' : 'increase',
			value: delta,
			start,
			end: running,
			isComputedTotal: false,
			extras
		});
	}

	// A bridge that already ends on a total would otherwise get the same bar twice.
	const lastStep = steps[steps.length - 1];
	if (options.appendTotal && steps.length > 0 && lastStep?.kind !== 'total') {
		steps.push({
			name: options.totalLabel,
			kind: 'total',
			value: running,
			start: 0,
			end: running,
			isComputedTotal: true
		});
	}

	return steps;
}

/**
 * `totals` entries that matched no row's raw or formatted x label. A typo here
 * fails quietly — the row just becomes a change bar — so callers surface these.
 */
export function findUnmatchedTotals(
	rows: readonly DataPoint[],
	options: { xColumn: string; totals: readonly string[]; formatName?: (raw: unknown) => string }
): string[] {
	if (options.totals.length === 0 || rows.length === 0) return [];
	const formatName = options.formatName ?? ((raw: unknown) => String(raw ?? 'null'));
	const seen = new Set<string>();
	for (const row of rows) {
		const raw = row[options.xColumn];
		seen.add(formatName(raw));
		seen.add(String(raw ?? ''));
	}
	return options.totals.filter((label) => !seen.has(label));
}

export const DEFAULT_BREAKDOWN_OTHER_LABEL = 'Other';

export interface BuildBreakdownStepsOptions {
	xColumn: string;
	yColumn: string;
	breakdownColumn: string;
	/** Explicit order of the `x` totals; unlisted values follow in source order. */
	xOrder?: readonly string[];
	/** Keep this many contributors per span (by absolute change) and fold the rest into one bar. */
	limit?: number;
	otherLabel?: string;
	formatName?: (raw: unknown) => string;
	formatBreakdownName?: (raw: unknown) => string;
}

/** Identity of an x value for grouping; type-tagged so null, '' and 0 never collide. */
export function periodKey(raw: unknown): string {
	if (raw === null || raw === undefined) return 'nil';
	if (raw instanceof Date) return `date:${raw.toISOString()}`;
	return `${typeof raw}:${String(raw)}`;
}

/**
 * Sort contributors so a span reads as a staircase: increases first, largest
 * on the left, then decreases with the largest fall last.
 */
function orderContributions<T extends { value: number }>(items: T[]): T[] {
	return [...items].sort((a, b) => {
		const aUp = a.value >= 0;
		const bUp = b.value >= 0;
		if (aUp !== bUp) return aUp ? -1 : 1;
		return b.value - a.value;
	});
}

/**
 * Turn `(x, breakdown, y)` rows into a variance bridge: each `x` value is a
 * total, and between two consecutive totals one bar per `breakdown` value
 * shows how much that value moved. A value present on only one side counts
 * as appearing from, or dropping to, zero.
 *
 * The deltas of a span sum to exactly the difference of its two totals, so the
 * next total always lines up with the running total — no reconciliation gap.
 */
export function buildBreakdownSteps(
	rows: readonly DataPoint[],
	options: BuildBreakdownStepsOptions
): WaterfallStep[] {
	const formatName = options.formatName ?? ((raw: unknown) => String(raw ?? 'null'));
	const formatBreakdownName =
		options.formatBreakdownName ?? ((raw: unknown) => String(raw ?? 'null'));
	const otherLabel = options.otherLabel ?? DEFAULT_BREAKDOWN_OTHER_LABEL;

	// Keyed by the raw x value: two periods that format alike (Jan 2023 / Jan 2024 under "mmm") stay distinct.
	const byX = new Map<
		string,
		{ label: string; rawLabels: string[]; values: Map<string, number> }
	>();
	for (const row of rows) {
		const rawX = row[options.xColumn];
		const rawKey = periodKey(rawX);
		let group = byX.get(rawKey);
		if (!group) {
			const label = formatName(rawX);
			group = { label, rawLabels: [label, String(rawX ?? '')], values: new Map() };
			byX.set(rawKey, group);
		}
		const breakdownName = formatBreakdownName(row[options.breakdownColumn]);
		const value = toFiniteNumber(row[options.yColumn]) ?? 0;
		group.values.set(breakdownName, (group.values.get(breakdownName) ?? 0) + value);
	}

	const xGroups = applyExplicitOrder([...byX.values()], (g) => g.rawLabels, options.xOrder);

	const totalOf = (values: Map<string, number>) =>
		[...values.values()].reduce((sum, v) => sum + v, 0);

	const steps: WaterfallStep[] = [];
	for (let i = 0; i < xGroups.length; i++) {
		const current = xGroups[i];
		const total = totalOf(current.values);
		steps.push({
			name: current.label,
			kind: 'total',
			value: total,
			start: 0,
			end: total,
			isComputedTotal: false
		});

		const next = xGroups[i + 1];
		if (!next) break;

		const names = new Set([...current.values.keys(), ...next.values.keys()]);
		let contributions = [...names]
			.map((name) => ({
				name,
				value: (next.values.get(name) ?? 0) - (current.values.get(name) ?? 0)
			}))
			.filter((c) => c.value !== 0);

		if (options.limit !== undefined && options.limit > 0 && contributions.length > options.limit) {
			const ranked = [...contributions].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
			const kept = ranked.slice(0, options.limit);
			const rest = ranked.slice(options.limit).reduce((sum, c) => sum + c.value, 0);
			contributions = orderContributions(kept);
			if (rest !== 0) contributions.push({ name: otherLabel, value: rest });
		} else {
			contributions = orderContributions(contributions);
		}

		const context = `${current.label} → ${next.label}`;
		let running = total;
		for (const contribution of contributions) {
			const start = running;
			running += contribution.value;
			steps.push({
				name: contribution.name,
				kind: contribution.value < 0 ? 'decrease' : 'increase',
				value: contribution.value,
				start,
				end: running,
				isComputedTotal: false,
				context
			});
		}
	}

	return steps;
}

/**
 * Numeric extent of the bar edges, for sizing and formatting the value axis.
 * By default zero is included (totals are drawn from it). With
 * `includeZero: false` — the fit-to-data axis — totals contribute only their
 * top, so the extent is just the range the changes actually move through.
 */
export function getWaterfallExtent(
	steps: readonly WaterfallStep[],
	options: { includeZero?: boolean } = {}
): { min: number; max: number } {
	const includeZero = options.includeZero ?? true;
	let min = includeZero ? 0 : Number.POSITIVE_INFINITY;
	let max = includeZero ? 0 : Number.NEGATIVE_INFINITY;
	for (const step of steps) {
		const edges = step.kind === 'total' && !includeZero ? [step.end] : [step.start, step.end];
		for (const edge of edges) {
			min = Math.min(min, edge);
			max = Math.max(max, edge);
		}
	}
	if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 0 };
	return { min, max };
}

/**
 * Text shown on a bar. Changes carry an explicit sign so a bridge reads as
 * "+300 / -200 / 1,250" at a glance; totals are plain values.
 */
export function formatStepLabel(
	step: Pick<WaterfallStep, 'kind' | 'value'>,
	format: (value: number) => string
): string {
	const formatted = format(step.value);
	if (step.kind === 'increase' && step.value > 0 && !formatted.startsWith('+')) {
		return `+${formatted}`;
	}
	return formatted;
}

/** Which legend entries a chart needs — only the kinds that actually appear. */
export function getPresentKinds(steps: readonly WaterfallStep[]): WaterfallBarKind[] {
	const order: WaterfallBarKind[] = ['increase', 'decrease', 'total'];
	const present = new Set(steps.map((s) => s.kind));
	return order.filter((kind) => present.has(kind));
}
