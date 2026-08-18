/**
 * Expands `custom_ranges` rules (`{ label, range, grain }`) into named `{ key, label }` presets for
 * `range_calendar`, consumed by the existing date-range pipeline. `range` is one window or a list of them in
 * the project's grammar; `grain` slices each window into one preset per period (no grain → a single preset).
 * An explicit start (`from <date>` or `<date> to <date>`) anchors grain periods to it (e.g. fiscal years, up
 * to the current period); relative grains snap to the calendar, except `week`, which anchors to the window
 * start. A malformed window is skipped without dropping its siblings.
 *
 * Keys are the absolute `"YYYY-MM-DD to YYYY-MM-DD"` strings the pipeline already understands (an open-ended
 * `from` keeps its `from <date>` key), assembled by pure string ops to stay timezone-safe. Per rule, presets
 * are grouped newest-first, capped, and de-duplicated by key.
 */
import {
	addDays,
	addWeeks,
	addMonths,
	addQuarters,
	addYears,
	startOfMonth as dfStartOfMonth,
	endOfMonth as dfEndOfMonth,
	startOfQuarter as dfStartOfQuarter,
	endOfQuarter as dfEndOfQuarter,
	startOfYear as dfStartOfYear,
	endOfYear as dfEndOfYear
} from 'date-fns';
import { resolveRangeToDates, DATE_BOUNDARY_TOKEN, PRESET_DEFINITIONS } from './date-options';
import { formatValue } from '../formatValue';

export interface CustomRangeRule {
	label?: string;
	/**
	 * One window — or a list of windows — in the project's date-range grammar, e.g. "last 6 weeks",
	 * "from 2021-10-01", or ["2025-02-03 to 2026-02-01", "2026-02-02 to 2027-02-01"] for an irregular calendar.
	 */
	range?: string | string[];
	/** Period to slice each window into: "day"|"week"|"month"|"quarter"|"year". With no grain each window is one preset. */
	grain?: string;
}

interface GeneratedRange {
	key: string;
	label: string;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const pad4 = (n: number) => String(n).padStart(4, '0');

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const yearOf = (iso: string) => Number(iso.slice(0, 4));
const monthOf = (iso: string) => Number(iso.slice(5, 7));
const dayOf = (iso: string) => Number(iso.slice(8, 10));
// Per-month day limits (Feb base 28; the 29th is allowed only in a leap year — see validIso).
const MONTH_MAX_DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];
const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
// Validate a literal `YYYY-MM-DD`, honoring leap years so e.g. 2025-02-29 (non-leap) is rejected.
const validIso = (v: string) => {
	if (!ISO.test(v)) return false;
	const m = monthOf(v);
	const d = dayOf(v);
	if (m < 1 || m > 12 || d < 1) return false;
	const max = m === 2 && isLeapYear(yearOf(v)) ? 29 : MONTH_MAX_DAYS[m];
	return d <= max;
};

// Local-midnight Date from an ISO string, and back — pure local getters keep everything timezone-safe.
const parseLocal = (iso: string) =>
	new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const toIso = (d: Date) =>
	`${pad4(d.getFullYear())}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/**
 * Fill label tokens from a period's resolved ISO start/end. `{start:CODE}` / `{end:CODE}` format that
 * boundary with any value-formatter date code — `{start:yyyy}` → `2024`, `{start:mmm yyyy}` → `Apr 2024`,
 * `{start:qq}` → `Q2`, `{end:yy}` → `24` — so labels read exactly like the value formatter everywhere else.
 */
function fillLabel(template: string, startIso: string, endIso: string): string {
	return template
		.replace(/\{start:([^}]*)\}/g, (_, code) => formatValue(parseLocal(startIso), code))
		.replace(/\{end:([^}]*)\}/g, (_, code) => formatValue(parseLocal(endIso), code));
}

// Default label per grain. A grain period is a single bucket, so its start date names it.
const GRAIN_DEFAULT_LABEL: Record<string, string> = {
	day: '{start:mmm d, yyyy}',
	week: 'Week of {start:mmm d, yyyy}',
	month: '{start:mmm yyyy}',
	quarter: '{start:qq} {start:yyyy}',
	year: '{start:yyyy}'
};

/** Valid `grain` values — derived from the default-label table so the schema validator can't drift from runtime. */
export const CUSTOM_RANGE_GRAINS = Object.keys(GRAIN_DEFAULT_LABEL);

const PRESET_LABEL = new Map<string, string>(PRESET_DEFINITIONS.map((p) => [p.key, p.label]));
const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
const humanIso = (iso: string) => `${MONTH_NAMES[monthOf(iso) - 1]} ${dayOf(iso)}, ${yearOf(iso)}`;

/**
 * Human label for an unlabelled, no-grain window. Reads the range as written — a known preset
 * ("last 30 days" → "Last 30 Days"), a dynamic "last/previous N <unit>" ("Last 5 Months"), else its
 * resolved dates ("Jan 1, 2020 – Apr 5, 2026", "From Jan 1, 2020") — so a one-off never shows a bare year.
 */
function defaultWindowLabel(range: string, bounds: { start?: string; end?: string }): string {
	const lc = range.trim().toLowerCase();
	const preset = PRESET_LABEL.get(lc);
	if (preset) return preset;
	// Only `last`/`previous` take a count; valid `this`/`next <unit>` are presets, handled above. Matching
	// them here would only fire on invalid input (e.g. "next 2 months" → a 12-month fallback) and mislabel it.
	const dyn = lc.match(/^(last|previous) (?:(\d+) )?(day|week|month|quarter|year)s?$/);
	if (dyn) {
		const [, word, count, unit] = dyn;
		const n = count ? Number(count) : 1;
		return `${titleCase(word)} ${count ? `${n} ` : ''}${titleCase(unit)}${n === 1 ? '' : 's'}`;
	}
	if (bounds.start && bounds.end) return `${humanIso(bounds.start)} – ${humanIso(bounds.end)}`;
	if (bounds.start) return `From ${humanIso(bounds.start)}`;
	if (bounds.end) return `Until ${humanIso(bounds.end)}`;
	return titleCase(range.trim());
}

// Cap on the presets one rule contributes, so a pathological window or list (e.g. grain="day" over decades)
// can't flood the picker. Applied per-window while stepping, then again to the assembled group (which keeps
// the newest MAX across all of a rule's windows).
const MAX_GENERATED_PERIODS = 1000;

// A range with a literal-date START (`from <date>`, `<date> to <date>`, `from <date> to <date>`), so grain
// periods anchor to a STABLE date. today/yesterday are excluded as the anchor (a dynamic start would drift the
// buckets daily → those snap to the calendar instead); the END may still be today/yesterday.
const ISO_DATE = '\\d{4}-\\d{2}-\\d{2}';
const EXPLICIT_START_RANGE = new RegExp(
	`^(?:from ${ISO_DATE}|(?:from )?${ISO_DATE} to (?:${DATE_BOUNDARY_TOKEN}))$`
);

function addGrain(d: Date, grain: string, k: number): Date {
	if (grain === 'week') return addWeeks(d, k);
	if (grain === 'month') return addMonths(d, k);
	if (grain === 'quarter') return addQuarters(d, k);
	if (grain === 'year') return addYears(d, k);
	return addDays(d, k);
}

// Largest k ≥ 0 with `addGrain(from, grain, k)` still ≤ `lastT` (−1 if even k=0 already exceeds it). Found by
// exponential + binary search so a huge span can start stepping near its newest period without iterating it all.
function lastStepIndex(from: Date, grain: string, lastT: number): number {
	if (addGrain(from, grain, 0).getTime() > lastT) return -1;
	let hi = 1;
	while (addGrain(from, grain, hi).getTime() <= lastT) hi *= 2;
	let lo = hi >> 1;
	while (lo + 1 < hi) {
		const mid = (lo + hi) >> 1;
		if (addGrain(from, grain, mid).getTime() <= lastT) lo = mid;
		else hi = mid;
	}
	return lo;
}

// Expand a single window string into presets, applying the entry's (already-resolved) grain + label template.
function expandWindow(
	rangeRaw: string,
	grain: string,
	userLabel: string | undefined,
	today: Date,
	firstDayOfWeek: 'sunday' | 'monday'
): GeneratedRange[] {
	const range = rangeRaw.trim();
	const bounds = resolveRangeToDates(range, today, firstDayOfWeek);
	if (!bounds?.start && !bounds?.end) return [];
	// Reject a window with a non-existent literal boundary (e.g. an absolute "2025-02-29" — Feb 29 in a
	// non-leap year) so it never reaches a preset key or silently rolls over during grain stepping.
	if ((bounds.start && !validIso(bounds.start)) || (bounds.end && !validIso(bounds.end))) return [];
	// Reject a reversed window (start after end, a typo) so it never produces a backwards preset key.
	if (bounds.start && bounds.end && bounds.start > bounds.end) return [];

	// No grain → a single preset spanning the whole window. An open-ended `from` keeps its `from <date>`
	// key so it stays open and matches future dates; otherwise it's a closed window. With no user label the
	// preset reads its name from the range itself ("last 30 days" → "Last 30 Days"), not a bare year.
	if (!grain) {
		if (!bounds.start) return [];
		const labelEnd = bounds.end ?? toIso(today);
		const key = bounds.end ? `${bounds.start} to ${bounds.end}` : `from ${bounds.start}`;
		const label = userLabel
			? fillLabel(userLabel, bounds.start, labelEnd)
			: defaultWindowLabel(range, bounds);
		return [{ key, label }];
	}

	const template = userLabel ?? GRAIN_DEFAULT_LABEL[grain];

	// Anchor stepping to the window start for from/absolute ranges and any `week` grain (so "last N weeks"
	// is seven-day buckets from its start, not calendar weeks); other relative grains snap to the calendar.
	// Either path steps the newest MAX periods ending at the window, so a huge span drops oldest, not newest.
	const explicitStart = EXPLICIT_START_RANGE.test(range.toLowerCase());
	const out: GeneratedRange[] = [];

	if ((explicitStart || grain === 'week') && bounds.start) {
		const anchor = parseLocal(bounds.start);
		const boundsEnd = bounds.end ? parseLocal(bounds.end) : null;
		const lastT = (boundsEnd ?? today).getTime();
		// A non-future end (`to today`/`to yesterday`/a past date) clamps the final period so it never runs
		// past the requested end. A future end lets periods reach their natural boundaries (upcoming periods).
		const clampDate = boundsEnd && boundsEnd.getTime() <= today.getTime() ? boundsEnd : null;
		const maxK = lastStepIndex(anchor, grain, lastT);
		for (let k = Math.max(0, maxK - MAX_GENERATED_PERIODS + 1); k <= maxK; k++) {
			const pStart = addGrain(anchor, grain, k);
			let pEnd = addDays(addGrain(anchor, grain, k + 1), -1);
			if (clampDate && pEnd.getTime() > clampDate.getTime()) pEnd = clampDate;
			const startIso = toIso(pStart);
			const endIso = toIso(pEnd);
			out.push({ key: `${startIso} to ${endIso}`, label: fillLabel(template, startIso, endIso) });
		}
		return out;
	}

	// Snapped path: relative day/month/quarter/year grains align to calendar boundaries (week is handled above).
	if (!bounds.start || !bounds.end) return [];
	const startOf = (d: Date) =>
		grain === 'month'
			? dfStartOfMonth(d)
			: grain === 'quarter'
				? dfStartOfQuarter(d)
				: grain === 'year'
					? dfStartOfYear(d)
					: d;
	const endOf = (d: Date) =>
		grain === 'month'
			? dfEndOfMonth(d)
			: grain === 'quarter'
				? dfEndOfQuarter(d)
				: grain === 'year'
					? dfEndOfYear(d)
					: d;
	const base = startOf(parseLocal(bounds.start));
	const maxK = lastStepIndex(base, grain, parseLocal(bounds.end).getTime());
	for (let k = Math.max(0, maxK - MAX_GENERATED_PERIODS + 1); k <= maxK; k++) {
		const cursor = addGrain(base, grain, k);
		const startIso = toIso(cursor);
		const endIso = toIso(endOf(cursor));
		out.push({ key: `${startIso} to ${endIso}`, label: fillLabel(template, startIso, endIso) });
	}
	return out;
}

function expandRange(
	rule: CustomRangeRule,
	today: Date,
	firstDayOfWeek: 'sunday' | 'monday'
): GeneratedRange[] {
	// grain and label are entry-level: resolved once, then applied to every window in `range`. An unknown
	// grain is an entry-level config error, so the whole entry yields nothing.
	const grain = typeof rule.grain === 'string' ? rule.grain.trim().toLowerCase() : '';
	if (grain && !(grain in GRAIN_DEFAULT_LABEL)) return [];
	const userLabel = typeof rule.label === 'string' ? rule.label : undefined;

	// `range` is one window or a list. Each expands independently (a malformed one is skipped, siblings kept)
	// and concatenates in declaration order. No early break: each window self-caps so the loop is bounded, and
	// expandCustomRanges trims the group to the newest MAX — breaking here would starve later, newer windows.
	const windows = Array.isArray(rule.range) ? rule.range : rule.range != null ? [rule.range] : [];
	const out: GeneratedRange[] = [];
	for (const win of windows) {
		if (typeof win !== 'string') continue;
		out.push(...expandWindow(win, grain, userLabel, today, firstDayOfWeek));
	}
	return out;
}

export function expandCustomRanges(
	rules: CustomRangeRule[] | undefined,
	today: Date,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday'
): GeneratedRange[] {
	const generated: GeneratedRange[] = [];
	for (const rule of Array.isArray(rules) ? rules : []) {
		if (!rule || typeof rule !== 'object') continue;
		const group = rule.range != null ? expandRange(rule, today, firstDayOfWeek) : [];
		// Keep each rule's presets together (all of one rule's FYs sit in one group), newest-first within it,
		// then trim to the cap so a multi-window rule keeps the newest MAX across its windows (never more).
		group.sort((a, b) => b.key.localeCompare(a.key));
		if (group.length > MAX_GENERATED_PERIODS) group.length = MAX_GENERATED_PERIODS;
		generated.push(...group);
	}
	// Drop duplicate periods, keeping the first (earliest-declared) occurrence so grouping is preserved.
	const seen = new Set<string>();
	return generated.filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)));
}

/**
 * Resolve a `default_range` that names a generated custom range by its label (e.g. "FY2025") to that
 * period's absolute key ("2025-02-01 to 2026-01-31"), so the date pipeline — which understands ranges and
 * keys, never labels — can select it. A built-in preset key is exempt (already resolvable, and it wins over
 * a custom range sharing its label — the picker lists built-ins before generated ranges). Every other value
 * that isn't an exact custom-range label is returned unchanged; a label shared by several periods resolves
 * to the first-declared one. Never guesses.
 */
export function resolveCustomRangeDefault(
	defaultRange: string | undefined,
	rules: CustomRangeRule[] | undefined,
	today: Date,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday'
): string | undefined {
	if (typeof defaultRange !== 'string' || !defaultRange.length) return defaultRange;
	if (!Array.isArray(rules) || rules.length === 0) return defaultRange;
	if (PRESET_LABEL.has(defaultRange.trim().toLowerCase())) return defaultRange;
	const match = expandCustomRanges(rules, today, firstDayOfWeek).find(
		(p) => p.label === defaultRange
	);
	return match ? match.key : defaultRange;
}
