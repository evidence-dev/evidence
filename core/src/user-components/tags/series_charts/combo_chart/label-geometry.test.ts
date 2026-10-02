import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
	renderChart,
	DATE_COL,
	NUMBER_COL,
	STRING_COL,
	type RenderArgs
} from './x-axis-test-harness';
import { findLabelViolations } from './label-geometry';

/**
 * Layout invariants for every chart the axis pipeline can produce: no two
 * labels overlap and none is cut off by the container. Asserted on the boxes
 * ECharts actually painted (SSR, same two layout passes as the browser), so a
 * rule that only holds for evenly spaced or "typical" data fails here.
 */

const pad = (n: number) => String(n).padStart(2, '0');
const DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDate = (ms: number, withTime: boolean) => {
	const d = new Date(ms);
	const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	return withTime ? `${date} ${pad(d.getHours())}:00:00` : date;
};

const datesToRows = (dates: string[]) => dates.map((x, i) => ({ x, y: 100 + ((i * 37) % 90) }));

function expectClean(args: RenderArgs) {
	const { geometry } = renderChart(args);
	expect(findLabelViolations(geometry)).toEqual([]);
	return geometry;
}

const xLabels = (args: RenderArgs) =>
	renderChart(args)
		.geometry.labels.filter((l) => l.kind === 'x')
		.sort((a, b) => a.corners[0][0] - b.corners[0][0])
		.map((l) => l.text);

describe('label geometry: irregular dates on a pinned time axis', () => {
	// An OSS report: dates over ~9 months, `x_fmt="mmm d/yy"`, two bars three
	// days apart. Every label was pinned to its bar, so "Mar 11/24" and
	// "Mar 14/24" painted on top of each other.
	const userReport: RenderArgs = {
		width: 1000,
		rows: datesToRows([
			'2024-01-08',
			'2024-02-12',
			'2024-03-11',
			'2024-03-14',
			'2024-04-22',
			'2024-05-20',
			'2024-06-17',
			'2024-07-15',
			'2024-08-26',
			'2024-09-30'
		]),
		columns: DATE_COL,
		x: 'x',
		y: 'y',
		fmt: 'mmm d/yy',
		seriesType: 'bar'
	};

	it.each([400, 700, 1000, 1400])('user report at %ipx: no overlap', (width) => {
		expectClean({ ...userReport, width });
	});

	it('drops only the crowded label; every other bar keeps its own', () => {
		expect(xLabels(userReport)).toEqual([
			'Jan 8/24',
			'Feb 12/24',
			'Mar 11/24',
			'Apr 22/24',
			'May 20/24',
			'Jun 17/24',
			'Jul 15/24',
			'Aug 26/24',
			'Sep 30/24'
		]);
	});

	const shapes: [string, string[], Partial<RenderArgs>][] = [
		[
			'six bars, two days apart',
			['2024-02-08', '2024-02-25', '2024-03-19', '2024-03-22', '2024-05-02', '2024-06-21'],
			{ fmt: 'mmm d/yy', seriesType: 'bar' }
		],
		[
			'three dates in a week among monthly points',
			[
				'2024-01-18',
				'2024-01-31',
				'2024-02-08',
				'2024-02-24',
				'2024-03-04',
				'2024-03-17',
				'2024-04-11',
				'2024-04-27',
				'2024-05-20',
				'2024-05-21',
				'2024-05-26',
				'2024-06-17',
				'2024-06-22',
				'2024-07-07'
			],
			{ fmt: 'mmm d/yy' }
		],
		[
			'clusters across a year boundary',
			[
				'2024-01-08',
				'2024-01-20',
				'2024-03-21',
				'2024-04-08',
				'2024-04-24',
				'2024-08-18',
				'2024-08-26',
				'2024-09-07',
				'2024-09-24',
				'2024-11-04',
				'2024-12-23',
				'2025-01-04',
				'2025-01-27'
			],
			{ fmt: 'mmm d/yy' }
		],
		[
			'default labels, three June dates',
			['2024-01-05', '2024-06-08', '2024-06-12', '2024-06-23'],
			{ seriesType: 'bar' }
		],
		['last two points one day apart', ['2024-01-31', '2024-08-13', '2024-08-14'], {}]
	];

	describe.each(shapes)('%s', (_name, dates, extra) => {
		it.each([360, 640, 1000, 1400])('%ipx', (width) => {
			expectClean({ width, rows: datesToRows(dates), columns: DATE_COL, x: 'x', y: 'y', ...extra });
		});
	});
});

// ── Generated scenarios ─────────────────────────────────────────────────────

const START_MS = new Date(2024, 0, 1).getTime();
const STEP_MS = { hour: DAY_MS / 24, day: DAY_MS, week: 7 * DAY_MS, month: 30.44 * DAY_MS };

const timeAxisArgs = fc
	.record({
		count: fc.integer({ min: 2, max: 30 }),
		spacing: fc.constantFrom('regular', 'irregular', 'clustered'),
		cadence: fc.constantFrom('hour', 'day', 'week', 'month'),
		spanDays: fc.integer({ min: 2, max: 900 }),
		seed: fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 30, maxLength: 30 }),
		fmt: fc.constantFrom(undefined, 'mmm d/yy', 'yyyy-mm-dd', 'mmm yyyy', 'dddd, mmmm d, yyyy'),
		grain: fc.constantFrom(undefined, 'day', 'week', 'month')
	})
	.map(({ count, spacing, cadence, spanDays, seed, fmt, grain }) => {
		let offsets: number[];
		if (spacing === 'regular') {
			offsets = Array.from({ length: count }, (_, i) => i * STEP_MS[cadence]);
		} else {
			offsets = seed.slice(0, count).map((r) => Math.floor(r * spanDays) * DAY_MS);
			if (spacing === 'clustered') {
				// Pull every other point to within a few days of its predecessor.
				offsets = offsets
					.sort((a, b) => a - b)
					.map((o, i, all) => (i % 2 ? all[i - 1] + (1 + Math.floor(seed[i] * 3)) * DAY_MS : o));
			}
		}
		const withTime = spacing === 'regular' && cadence === 'hour';
		const dates = [...new Set(offsets.map((o) => toIsoDate(START_MS + o, withTime)))];
		return {
			rows: datesToRows(dates),
			columns: DATE_COL,
			fmt,
			dateGrain: spacing === 'regular' ? (grain ?? undefined) : undefined
		};
	});

const words = ['North', 'South', 'Enterprise', 'SMB', 'Online', 'Retail', 'Partner', 'Direct'];
const categoryRows = (count: number, wordsPerLabel: number) =>
	Array.from({ length: count }, (_, i) => ({
		x: `${Array.from({ length: wordsPerLabel }, (_, w) => words[(i + w) % words.length]).join(' ')} ${i}`,
		y: 100 + ((i * 37) % 90)
	}));

const categoryAxisArgs = fc
	.record({
		count: fc.integer({ min: 1, max: 30 }),
		wordsPerLabel: fc.integer({ min: 1, max: 5 })
	})
	.map(({ count, wordsPerLabel }) => ({
		rows: categoryRows(count, wordsPerLabel),
		columns: STRING_COL,
		fmt: undefined,
		dateGrain: undefined
	}));

const valueAxisArgs = fc
	.record({ count: fc.integer({ min: 2, max: 40 }), start: fc.integer({ min: 0, max: 2020 }) })
	.map(({ count, start }) => ({
		rows: Array.from({ length: count }, (_, i) => ({ x: start + i, y: 100 + ((i * 37) % 90) })),
		columns: NUMBER_COL,
		fmt: undefined,
		dateGrain: undefined
	}));

const withChartOptions = (
	axis: fc.Arbitrary<Pick<RenderArgs, 'rows' | 'columns' | 'fmt' | 'dateGrain'>>
) =>
	fc
		.record({
			axis,
			width: fc.integer({ min: 280, max: 1600 }),
			seriesType: fc.constantFrom('bar' as const, 'line' as const),
			dataLabels: fc.boolean(),
			title: fc.constantFrom(undefined, 'Order date')
		})
		.map(
			({ axis, width, seriesType, dataLabels, title }): RenderArgs => ({
				...axis,
				width,
				x: 'x',
				y: 'y',
				seriesType,
				dataLabels,
				title
			})
		);

const timeChartsForSurvey = withChartOptions(timeAxisArgs);
const anyChartsForSurvey = withChartOptions(
	fc.oneof(
		{ weight: 3, arbitrary: timeAxisArgs },
		{ weight: 1, arbitrary: categoryAxisArgs },
		{ weight: 1, arbitrary: valueAxisArgs }
	)
);

const xAxisType = (args: RenderArgs) => args.columns.find((c) => c.name === 'x')?.jsType;

// Each class is pinned by a test in "known failures" below; delete its entry
// when that bug is fixed.
const isKnownFailure = (violation: string, args: RenderArgs) =>
	// Value label vs y-axis tick label or title.
	/^overlap: (data "[^"]*" ⟷ y |y "[^"]*" ⟷ data )/.test(violation) ||
	// Rotated category label cut off; wide edge label on a time axis cut off.
	violation.startsWith('cutoff: x "') ||
	// Rotated category labels overlapping on narrow charts.
	(xAxisType(args) === 'string' && /^overlap: x "[^"]*" ⟷ x /.test(violation));

describe('label geometry: generated charts', () => {
	it('every chart obeys the layout rules, apart from the known failures below', () => {
		fc.assert(
			fc.property(anyChartsForSurvey, (args) => {
				const violations = findLabelViolations(renderChart(args).geometry).filter(
					(v) => !isKnownFailure(v, args)
				);
				if (violations.length > 0) {
					throw new Error(`${violations.join('\n')}\nargs: ${JSON.stringify(args)}`);
				}
			}),
			{ numRuns: 300, seed: 20261001 }
		);
	});

	it('time-axis x labels never overlap', () => {
		fc.assert(
			fc.property(timeChartsForSurvey, (args) => {
				const violations = findLabelViolations(renderChart(args).geometry).filter((v) =>
					/^overlap: x "[^"]*" ⟷ x /.test(v)
				);
				if (violations.length > 0) {
					throw new Error(`${violations.join('\n')}\nargs: ${JSON.stringify(args)}`);
				}
			}),
			{ numRuns: 300, seed: 20261001 }
		);
	});

	// Opt-in: `LABEL_GEOMETRY_SURVEY=1` renders thousands of generated charts and
	// prints every violation class with a count and an example — the to-do list
	// the known failures below were taken from.
	it.runIf(process.env.LABEL_GEOMETRY_SURVEY)(
		'survey: every violation class',
		() => {
			const samples = fc.sample(anyChartsForSurvey, { numRuns: 2000 });
			const classes = new Map<string, { count: number; example: string }>();
			for (const args of samples) {
				for (const violation of findLabelViolations(renderChart(args).geometry)) {
					const kinds = [...violation.matchAll(/(x|y|data|title) "/g)].map((m) => m[1]).join('–');
					const axis = args.columns.find((c) => c.name === 'x')?.jsType;
					const key = `${violation.split(':')[0]} ${kinds} · ${axis} ${args.seriesType}${args.dataLabels ? ' + data labels' : ''}`;
					const entry = classes.get(key) ?? {
						count: 0,
						example: `${violation}\n  ${JSON.stringify(args)}`
					};
					entry.count++;
					classes.set(key, entry);
				}
			}
			const report = [...classes.entries()]
				.sort((a, b) => b[1].count - a[1].count)
				.map(([key, { count, example }]) => `${count}\t${key}\n  ${example}`)
				.join('\n');
			console.log(report || 'no violations');
		},
		300_000
	);
});

// Layout bugs the generator found that this suite doesn't yet fix. Each is a
// concrete chart that breaks the rules today; `it.fails` turns red the moment
// a fix lands, so the case gets promoted to a passing test instead of rotting.
describe('label geometry: known failures', () => {
	it.fails('value label on the first line point collides with a y-axis tick label', () => {
		const revenue = [812, 845, 901, 876, 934, 990, 1012, 1088, 1105, 1170, 1213, 1286];
		expectClean({
			width: 390,
			rows: revenue.map((k, i) => ({
				x: `2024-${String(i + 1).padStart(2, '0')}-01`,
				y: k * 1000
			})),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			seriesType: 'line',
			dataLabels: true
		});
	});

	it.fails('data label on a tall first bar collides with the y-axis title', () => {
		expectClean({
			width: 290,
			rows: [
				{ x: '2024-01-01', y: 174 },
				{ x: '2024-01-04', y: 100 },
				{ x: '2024-01-09', y: 121 },
				{ x: '2024-01-10', y: 158 }
			],
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			seriesType: 'bar',
			dataLabels: true
		});
	});

	it.fails('first rotated category label is cut off at the left edge', () => {
		expectClean({
			width: 281,
			rows: categoryRows(2, 5),
			columns: STRING_COL,
			x: 'x',
			y: 'y',
			seriesType: 'line'
		});
	});

	it.fails('rotated category labels overlap on a narrow chart', () => {
		expectClean({
			width: 285,
			rows: categoryRows(23, 4),
			columns: STRING_COL,
			x: 'x',
			y: 'y',
			seriesType: 'bar'
		});
	});

	it.fails('wide last label on an ECharts-ticked time axis is cut off at the right edge', () => {
		expectClean({
			width: 289,
			rows: datesToRows(
				Array.from({ length: 28 }, (_, i) => toIsoDate(START_MS + i * 7 * DAY_MS, false))
			),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			seriesType: 'bar',
			fmt: 'dddd, mmmm d, yyyy',
			dateGrain: 'week'
		});
	});
});
