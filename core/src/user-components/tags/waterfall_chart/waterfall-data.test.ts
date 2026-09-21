import { describe, it, expect } from 'vitest';
import {
	applyExplicitOrder,
	buildBreakdownSteps,
	buildWaterfallSteps,
	findUnmatchedTotals,
	formatStepLabel,
	getPresentKinds,
	getWaterfallExtent,
	isTotalMarker,
	periodKey,
	type WaterfallStep
} from './waterfall-data';

const bridge = [
	{ step: 'Start', amount: 1000, kind: 'total' },
	{ step: 'New', amount: 300, kind: 'change' },
	{ step: 'Upsell', amount: 150, kind: null },
	{ step: 'Churn', amount: -200, kind: 'change' },
	{ step: 'End', amount: null, kind: 'Total' }
];

const summarize = (steps: WaterfallStep[]) =>
	steps.map((s) => [s.name, s.kind, s.value, s.start, s.end]);

describe('isTotalMarker', () => {
	it('matches total/subtotal case-insensitively and ignores whitespace', () => {
		expect(isTotalMarker('total')).toBe(true);
		expect(isTotalMarker('  Subtotal ')).toBe(true);
		expect(isTotalMarker('TOTAL')).toBe(true);
	});

	it('treats anything else as a change', () => {
		expect(isTotalMarker('change')).toBe(false);
		expect(isTotalMarker('relative')).toBe(false);
		expect(isTotalMarker(null)).toBe(false);
		expect(isTotalMarker(undefined)).toBe(false);
		expect(isTotalMarker(1)).toBe(false);
	});
});

describe('buildWaterfallSteps', () => {
	it('runs a cumulative total through changes and appends a computed total', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'A', amount: 100 },
				{ step: 'B', amount: -30 },
				{ step: 'C', amount: 50 }
			],
			{ xColumn: 'step', yColumn: 'amount', appendTotal: true, totalLabel: 'Total' }
		);
		expect(summarize(steps)).toEqual([
			['A', 'increase', 100, 0, 100],
			['B', 'decrease', -30, 100, 70],
			['C', 'increase', 50, 70, 120],
			['Total', 'total', 120, 0, 120]
		]);
		expect(steps[3].isComputedTotal).toBe(true);
		expect(steps.slice(0, 3).every((s) => !s.isComputedTotal)).toBe(true);
	});

	it('marks totals from bar_type, resets the running total, and fills a null total from the run', () => {
		const steps = buildWaterfallSteps(bridge, {
			xColumn: 'step',
			yColumn: 'amount',
			barTypeColumn: 'kind',
			appendTotal: true,
			totalLabel: 'Total'
		});
		expect(summarize(steps)).toEqual([
			['Start', 'total', 1000, 0, 1000],
			['New', 'increase', 300, 1000, 1300],
			['Upsell', 'increase', 150, 1300, 1450],
			['Churn', 'decrease', -200, 1450, 1250],
			['End', 'total', 1250, 0, 1250]
		]);
	});

	it('does not append a second total when the last row is already a total', () => {
		const steps = buildWaterfallSteps(bridge, {
			xColumn: 'step',
			yColumn: 'amount',
			barTypeColumn: 'kind',
			appendTotal: true,
			totalLabel: 'Total'
		});
		expect(steps.filter((s) => s.isComputedTotal)).toHaveLength(0);
		expect(steps[steps.length - 1].name).toBe('End');
	});

	it('marks totals from the totals list, matching the raw or formatted label', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'Start', amount: 500 },
				{ step: 'Ops', amount: 120 },
				{ step: 'Capex', amount: -80 }
			],
			{
				xColumn: 'step',
				yColumn: 'amount',
				totals: ['Start'],
				appendTotal: true,
				totalLabel: 'Closing'
			}
		);
		expect(summarize(steps)).toEqual([
			['Start', 'total', 500, 0, 500],
			['Ops', 'increase', 120, 500, 620],
			['Capex', 'decrease', -80, 620, 540],
			['Closing', 'total', 540, 0, 540]
		]);
	});

	it('matches totals against the formatted name when x is formatted', () => {
		const steps = buildWaterfallSteps(
			[
				{ month: '2024-01-01', amount: 10 },
				{ month: '2024-02-01', amount: 5 }
			],
			{
				xColumn: 'month',
				yColumn: 'amount',
				totals: ['Jan'],
				appendTotal: false,
				totalLabel: 'Total',
				formatName: (raw) => (raw === '2024-01-01' ? 'Jan' : 'Feb')
			}
		);
		expect(summarize(steps)).toEqual([
			['Jan', 'total', 10, 0, 10],
			['Feb', 'increase', 5, 10, 15]
		]);
	});

	it('honors appendTotal=false', () => {
		const steps = buildWaterfallSteps([{ step: 'A', amount: 5 }], {
			xColumn: 'step',
			yColumn: 'amount',
			appendTotal: false,
			totalLabel: 'Total'
		});
		expect(steps).toHaveLength(1);
	});

	it('returns no bars (and no total) for an empty result', () => {
		expect(
			buildWaterfallSteps([], {
				xColumn: 'step',
				yColumn: 'amount',
				appendTotal: true,
				totalLabel: 'Total'
			})
		).toEqual([]);
	});

	it('treats null, blank and non-numeric changes as zero increases', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'A', amount: null },
				{ step: 'B', amount: '' },
				{ step: 'C', amount: 'abc' },
				{ step: 'D', amount: '25' }
			],
			{ xColumn: 'step', yColumn: 'amount', appendTotal: false, totalLabel: 'Total' }
		);
		expect(summarize(steps)).toEqual([
			['A', 'increase', 0, 0, 0],
			['B', 'increase', 0, 0, 0],
			['C', 'increase', 0, 0, 0],
			['D', 'increase', 25, 0, 25]
		]);
	});

	it('handles a bridge that crosses zero', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'A', amount: 40 },
				{ step: 'B', amount: -100 }
			],
			{ xColumn: 'step', yColumn: 'amount', appendTotal: true, totalLabel: 'Net' }
		);
		expect(summarize(steps)).toEqual([
			['A', 'increase', 40, 0, 40],
			['B', 'decrease', -100, 40, -60],
			['Net', 'total', -60, 0, -60]
		]);
		expect(getWaterfallExtent(steps)).toEqual({ min: -60, max: 40 });
	});

	it('reorders rows by an explicit x order, keeping unlisted rows after in source order', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'Churn', amount: -200 },
				{ step: 'Other', amount: 1 },
				{ step: 'Start', amount: 1000 },
				{ step: 'New', amount: 300 }
			],
			{
				xColumn: 'step',
				yColumn: 'amount',
				totals: ['Start'],
				xOrder: ['Start', 'New', 'Churn'],
				appendTotal: true,
				totalLabel: 'End'
			}
		);
		expect(steps.map((s) => s.name)).toEqual(['Start', 'New', 'Churn', 'Other', 'End']);
		expect(steps[steps.length - 1].end).toBe(1101);
	});

	it('carries tooltip extras per row and none for the computed total', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'A', amount: 1, region: 'EU' },
				{ step: 'B', amount: 2, region: 'US' }
			],
			{
				xColumn: 'step',
				yColumn: 'amount',
				appendTotal: true,
				totalLabel: 'Total',
				extractExtras: (row) => ({ region: row.region })
			}
		);
		expect(steps.map((s) => s.extras)).toEqual([{ region: 'EU' }, { region: 'US' }, undefined]);
	});

	it('uses the formatted name for null x values', () => {
		const steps = buildWaterfallSteps([{ step: null, amount: 3 }], {
			xColumn: 'step',
			yColumn: 'amount',
			appendTotal: false,
			totalLabel: 'Total'
		});
		expect(steps[0].name).toBe('null');
	});
});

describe('buildBreakdownSteps', () => {
	const snapshots = [
		{ period: 2023, segment: 'Enterprise', revenue: 4000 },
		{ period: 2023, segment: 'Mid-market', revenue: 2500 },
		{ period: 2023, segment: 'SMB', revenue: 1500 },
		{ period: 2024, segment: 'Enterprise', revenue: 4800 },
		{ period: 2024, segment: 'Mid-market', revenue: 2300 },
		{ period: 2024, segment: 'SMB', revenue: 1900 }
	];
	const base = { xColumn: 'period', yColumn: 'revenue', breakdownColumn: 'segment' };

	it('draws each x as a total with one contribution bar per breakdown value in between', () => {
		const steps = buildBreakdownSteps(snapshots, base);
		expect(summarize(steps)).toEqual([
			['2023', 'total', 8000, 0, 8000],
			['Enterprise', 'increase', 800, 8000, 8800],
			['SMB', 'increase', 400, 8800, 9200],
			['Mid-market', 'decrease', -200, 9200, 9000],
			['2024', 'total', 9000, 0, 9000]
		]);
	});

	it('reconciles: the running total lands exactly on the next total', () => {
		const steps = buildBreakdownSteps(snapshots, base);
		const lastChange = steps[steps.length - 2];
		expect(lastChange.end).toBeCloseTo(steps[steps.length - 1].value);
	});

	it('orders increases largest-first, then decreases with the largest fall last', () => {
		const steps = buildBreakdownSteps(
			[
				{ p: 1, s: 'a', v: 10 },
				{ p: 1, s: 'b', v: 10 },
				{ p: 1, s: 'c', v: 10 },
				{ p: 1, s: 'd', v: 10 },
				{ p: 2, s: 'a', v: 12 },
				{ p: 2, s: 'b', v: 15 },
				{ p: 2, s: 'c', v: 4 },
				{ p: 2, s: 'd', v: 9 }
			],
			{ xColumn: 'p', yColumn: 'v', breakdownColumn: 's' }
		);
		expect(steps.slice(1, -1).map((s) => s.name)).toEqual(['b', 'a', 'd', 'c']);
	});

	it('tags each contribution with the span it belongs to and drops zero changes', () => {
		const steps = buildBreakdownSteps(
			[
				{ p: 'Q1', s: 'a', v: 5 },
				{ p: 'Q1', s: 'flat', v: 3 },
				{ p: 'Q2', s: 'a', v: 7 },
				{ p: 'Q2', s: 'flat', v: 3 }
			],
			{ xColumn: 'p', yColumn: 'v', breakdownColumn: 's' }
		);
		expect(steps.map((s) => s.name)).toEqual(['Q1', 'a', 'Q2']);
		expect(steps[1].context).toBe('Q1 → Q2');
		expect(steps[0].context).toBeUndefined();
	});

	it('treats a value present on one side only as moving from or to zero', () => {
		const steps = buildBreakdownSteps(
			[
				{ p: 1, s: 'kept', v: 10 },
				{ p: 1, s: 'gone', v: 4 },
				{ p: 2, s: 'kept', v: 10 },
				{ p: 2, s: 'new', v: 6 }
			],
			{ xColumn: 'p', yColumn: 'v', breakdownColumn: 's' }
		);
		expect(summarize(steps)).toEqual([
			['1', 'total', 14, 0, 14],
			['new', 'increase', 6, 14, 20],
			['gone', 'decrease', -4, 20, 16],
			['2', 'total', 16, 0, 16]
		]);
	});

	it('repeats the span pattern across more than two x values', () => {
		const steps = buildBreakdownSteps(
			[
				{ p: 1, s: 'a', v: 1 },
				{ p: 2, s: 'a', v: 3 },
				{ p: 3, s: 'a', v: 2 }
			],
			{ xColumn: 'p', yColumn: 'v', breakdownColumn: 's' }
		);
		expect(steps.map((s) => [s.name, s.kind])).toEqual([
			['1', 'total'],
			['a', 'increase'],
			['2', 'total'],
			['a', 'decrease'],
			['3', 'total']
		]);
		expect(steps[3].context).toBe('2 → 3');
	});

	it('folds contributors beyond the limit into an Other bar, ranked by absolute change', () => {
		const steps = buildBreakdownSteps(
			[
				{ p: 1, s: 'big', v: 0 },
				{ p: 1, s: 'mid', v: 0 },
				{ p: 1, s: 'tiny1', v: 0 },
				{ p: 1, s: 'tiny2', v: 0 },
				{ p: 2, s: 'big', v: -50 },
				{ p: 2, s: 'mid', v: 20 },
				{ p: 2, s: 'tiny1', v: 1 },
				{ p: 2, s: 'tiny2', v: 2 }
			],
			{ xColumn: 'p', yColumn: 'v', breakdownColumn: 's', limit: 2 }
		);
		expect(summarize(steps)).toEqual([
			['1', 'total', 0, 0, 0],
			['mid', 'increase', 20, 0, 20],
			['big', 'decrease', -50, 20, -30],
			['Other', 'increase', 3, -30, -27],
			['2', 'total', -27, 0, -27]
		]);
	});

	it('honors an explicit x order and formats x labels', () => {
		const steps = buildBreakdownSteps(
			[
				{ p: '2024-01-01', s: 'a', v: 2 },
				{ p: '2023-01-01', s: 'a', v: 1 }
			],
			{
				xColumn: 'p',
				yColumn: 'v',
				breakdownColumn: 's',
				formatName: (raw) => String(raw).slice(0, 4),
				xOrder: ['2023-01-01', '2024-01-01']
			}
		);
		expect(steps.map((s) => s.name)).toEqual(['2023', 'a', '2024']);
	});

	it('keeps periods distinct when their formatted labels collide', () => {
		const steps = buildBreakdownSteps(
			[
				{ month: '2023-01-01', s: 'a', v: 10 },
				{ month: '2024-01-01', s: 'a', v: 15 }
			],
			{
				xColumn: 'month',
				yColumn: 'v',
				breakdownColumn: 's',
				formatName: () => 'Jan'
			}
		);
		expect(steps.map((s) => [s.name, s.kind, s.value])).toEqual([
			['Jan', 'total', 10],
			['a', 'increase', 5],
			['Jan', 'total', 15]
		]);
	});

	it('groups Date-typed x values by instant, not by object identity', () => {
		const steps = buildBreakdownSteps(
			[
				{ d: new Date('2024-01-01T00:00:00Z'), s: 'a', v: 1 },
				{ d: new Date('2024-01-01T00:00:00Z'), s: 'b', v: 2 },
				{ d: new Date('2024-02-01T00:00:00Z'), s: 'a', v: 3 }
			],
			{ xColumn: 'd', yColumn: 'v', breakdownColumn: 's', formatName: (raw) => String(raw) }
		);
		expect(steps.filter((s) => s.kind === 'total').map((s) => s.value)).toEqual([3, 3]);
	});

	it('keeps null, empty-string and zero x values as distinct periods', () => {
		const steps = buildBreakdownSteps(
			[
				{ p: null, s: 'a', v: 1 },
				{ p: '', s: 'a', v: 2 },
				{ p: 0, s: 'a', v: 3 },
				{ p: '0', s: 'a', v: 4 }
			],
			{ xColumn: 'p', yColumn: 'v', breakdownColumn: 's' }
		);
		expect(steps.filter((s) => s.kind === 'total').map((s) => s.value)).toEqual([1, 2, 3, 4]);
	});

	it('returns a single total for one period and nothing for no rows', () => {
		expect(
			buildBreakdownSteps([{ p: 1, s: 'a', v: 5 }], {
				xColumn: 'p',
				yColumn: 'v',
				breakdownColumn: 's'
			}).map((s) => s.kind)
		).toEqual(['total']);
		expect(buildBreakdownSteps([], base)).toEqual([]);
	});
});

describe('findUnmatchedTotals', () => {
	const rows = [
		{ step: 'Start of year', people: 210 },
		{ step: 'Hires', people: 64 }
	];

	it('reports entries that match neither the raw nor the formatted label', () => {
		expect(
			findUnmatchedTotals(rows, { xColumn: 'step', totals: ['Start of yeer', 'Hires'] })
		).toEqual(['Start of yeer']);
	});

	it('accepts a match on the formatted label', () => {
		expect(
			findUnmatchedTotals([{ month: '2024-01-01', v: 1 }], {
				xColumn: 'month',
				totals: ['Jan 2024'],
				formatName: () => 'Jan 2024'
			})
		).toEqual([]);
	});

	it('stays quiet with no totals or before data has arrived', () => {
		expect(findUnmatchedTotals(rows, { xColumn: 'step', totals: [] })).toEqual([]);
		expect(findUnmatchedTotals([], { xColumn: 'step', totals: ['Start'] })).toEqual([]);
	});
});

describe('periodKey', () => {
	it('separates values that stringify alike', () => {
		const keys = [null, undefined, '', 0, '0', new Date('2024-01-01T00:00:00Z')].map(periodKey);
		expect(new Set(keys).size).toBe(5); // null and undefined intentionally share a key
		expect(periodKey(null)).toBe(periodKey(undefined));
	});

	it('groups equal Date instants together', () => {
		expect(periodKey(new Date('2024-01-01T00:00:00Z'))).toBe(
			periodKey(new Date('2024-01-01T00:00:00.000Z'))
		);
	});
});

describe('applyExplicitOrder', () => {
	it('is a stable no-op without an order', () => {
		const rows = ['b', 'a', 'c'];
		expect(applyExplicitOrder(rows, (r) => [r], undefined)).toEqual(rows);
		expect(applyExplicitOrder(rows, (r) => [r], [])).toEqual(rows);
	});

	it('matches on any of the labels a row exposes', () => {
		const rows = [
			{ raw: '2024-02-01', label: 'Feb' },
			{ raw: '2024-01-01', label: 'Jan' }
		];
		const ordered = applyExplicitOrder(rows, (r) => [r.label, r.raw], ['2024-01-01', 'Feb']);
		expect(ordered.map((r) => r.label)).toEqual(['Jan', 'Feb']);
	});
});

describe('getWaterfallExtent', () => {
	it('always includes zero so totals have a baseline', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'Start', amount: 900 },
				{ step: 'Up', amount: 50 }
			],
			{
				xColumn: 'step',
				yColumn: 'amount',
				totals: ['Start'],
				appendTotal: false,
				totalLabel: 'Total'
			}
		);
		expect(getWaterfallExtent(steps)).toEqual({ min: 0, max: 950 });
	});

	it('without zero, spans only the range the changes move through (totals count their top)', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'Start', amount: 10200 },
				{ step: 'Up', amount: 300 },
				{ step: 'Down', amount: -50 }
			],
			{
				xColumn: 'step',
				yColumn: 'amount',
				totals: ['Start'],
				appendTotal: true,
				totalLabel: 'End'
			}
		);
		expect(getWaterfallExtent(steps, { includeZero: false })).toEqual({ min: 10200, max: 10500 });
	});

	it('is a zero extent for no steps', () => {
		expect(getWaterfallExtent([])).toEqual({ min: 0, max: 0 });
		expect(getWaterfallExtent([], { includeZero: false })).toEqual({ min: 0, max: 0 });
	});
});

describe('formatStepLabel', () => {
	const fmt = (v: number) => (v < 0 ? `-$${Math.abs(v)}` : `$${v}`);

	it('prefixes increases with a plus sign', () => {
		expect(formatStepLabel({ kind: 'increase', value: 300 }, fmt)).toBe('+$300');
	});

	it('leaves decreases to the formatter (which already carries the minus)', () => {
		expect(formatStepLabel({ kind: 'decrease', value: -200 }, fmt)).toBe('-$200');
	});

	it('shows totals and zero changes unsigned', () => {
		expect(formatStepLabel({ kind: 'total', value: 1250 }, fmt)).toBe('$1250');
		expect(formatStepLabel({ kind: 'increase', value: 0 }, fmt)).toBe('$0');
	});

	it('does not double a plus sign the formatter already added', () => {
		expect(formatStepLabel({ kind: 'increase', value: 5 }, (v) => `+${v}`)).toBe('+5');
	});
});

describe('getPresentKinds', () => {
	it('lists only the kinds in the data, in legend order', () => {
		const steps = buildWaterfallSteps(
			[
				{ step: 'A', amount: -5 },
				{ step: 'B', amount: 10 }
			],
			{ xColumn: 'step', yColumn: 'amount', appendTotal: true, totalLabel: 'Total' }
		);
		expect(getPresentKinds(steps)).toEqual(['increase', 'decrease', 'total']);
		expect(getPresentKinds(steps.slice(1, 2))).toEqual(['increase']);
	});
});
