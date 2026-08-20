import { describe, expect, it } from 'vitest';
import {
	calculateColorStylesFromHex,
	calculateColorStyles,
	calculateVizRanges,
	buildColorVizScale
} from './table-viz';
import { generatePivotData, type PivotConfig } from '../../common/pivot-utils';
import type { DataPoint } from '../../types';
import type { UnifiedColumnDefinition } from './unified-column-definition.types';

describe('calculateColorStylesFromHex', () => {
	it('returns styles for a valid hex color', () => {
		const result = calculateColorStylesFromHex('#22c55e');
		expect(result).not.toBeNull();
		expect(result!.backgroundColor).toBe('#22c55e');
		expect(result!.color).toBe('#000000'); // green is light enough for black text
		expect(result!.borderBottomColor).toBeTruthy();
		expect(result!.topBorderColor).toBeTruthy();
	});

	it('picks white text on dark backgrounds', () => {
		const result = calculateColorStylesFromHex('#1e3a5f');
		expect(result).not.toBeNull();
		expect(result!.color).toBe('#ffffff');
	});

	it('picks black text on light backgrounds', () => {
		const result = calculateColorStylesFromHex('#dcfce7');
		expect(result).not.toBeNull();
		expect(result!.color).toBe('#000000');
	});

	it('returns null for invalid color strings', () => {
		expect(calculateColorStylesFromHex('not-a-color')).toBeNull();
		expect(calculateColorStylesFromHex('')).toBeNull();
	});

	it('handles named CSS colors', () => {
		const result = calculateColorStylesFromHex('red');
		expect(result).not.toBeNull();
		expect(result!.backgroundColor).toBeTruthy();
	});
});

describe('calculateColorStyles conditional_colors null fallthrough', () => {
	it('returns null when conditional_colors column is present but value is null', () => {
		const result = calculateColorStyles(
			{ color_options: { conditional_colors: '__cc_col' } },
			'measure_col',
			{ measure_col: 100, __cc_col: null },
			{ min: 0, max: 200 }
		);
		expect(result).toBeNull();
	});

	it('returns null when conditional_colors column is present but value is empty string', () => {
		const result = calculateColorStyles(
			{ color_options: { conditional_colors: '__cc_col' } },
			'measure_col',
			{ measure_col: 100, __cc_col: '' },
			{ min: 0, max: 200 }
		);
		expect(result).toBeNull();
	});

	it('returns color styles when conditional_colors column has a valid color', () => {
		const result = calculateColorStyles(
			{ color_options: { conditional_colors: '__cc_col' } },
			'measure_col',
			{ measure_col: 100, __cc_col: '#22c55e' },
			{ min: 0, max: 200 }
		);
		expect(result).not.toBeNull();
		expect(result!.backgroundColor).toBe('#22c55e');
	});

	it('falls through to gradient scale when no conditional_colors is configured', () => {
		const result = calculateColorStyles(
			{ color_options: {} },
			'measure_col',
			{ measure_col: 100 },
			{ min: 0, max: 200 }
		);
		expect(result).not.toBeNull();
		expect(result!.backgroundColor).toBeTruthy();
	});
});

describe('calculateColorStyles color_stops', () => {
	const stops = [
		{ value: -1, color: '#e74c3c' },
		{ value: 0, color: '#f39c12' },
		{ value: 1, color: '#27ae60' }
	];
	const pinned = { color_options: { color_stops: stops } };

	it('pins each value to its color independent of the data range', () => {
		// range is intentionally unrelated to the stops — colors anchor to fixed values
		const atMin = calculateColorStyles(pinned, 'growth', { growth: -1 }, { min: -100, max: 100 });
		expect(atMin!.backgroundColor.toLowerCase()).toBe('#e74c3c');

		const atMid = calculateColorStyles(pinned, 'growth', { growth: 0 }, { min: -100, max: 100 });
		expect(atMid!.backgroundColor.toLowerCase()).toBe('#f39c12');

		const atMax = calculateColorStyles(pinned, 'growth', { growth: 1 }, { min: -100, max: 100 });
		expect(atMax!.backgroundColor.toLowerCase()).toBe('#27ae60');
	});

	it('clamps values beyond the outermost stops to the end colors', () => {
		const aboveMax = calculateColorStyles(pinned, 'growth', { growth: 5 }, { min: -100, max: 100 });
		expect(aboveMax!.backgroundColor.toLowerCase()).toBe('#27ae60');

		const belowMin = calculateColorStyles(
			pinned,
			'growth',
			{ growth: -5 },
			{ min: -100, max: 100 }
		);
		expect(belowMin!.backgroundColor.toLowerCase()).toBe('#e74c3c');
	});

	it('interpolates between stops', () => {
		const halfway = calculateColorStyles(
			pinned,
			'growth',
			{ growth: 0.5 },
			{ min: -100, max: 100 }
		);
		expect(halfway).not.toBeNull();
		// Between orange (0) and green (1) — not equal to either endpoint
		expect(halfway!.backgroundColor.toLowerCase()).not.toBe('#f39c12');
		expect(halfway!.backgroundColor.toLowerCase()).not.toBe('#27ae60');
	});

	it('sorts stops by value so authoring order does not matter', () => {
		const unordered = {
			color_options: {
				color_stops: [
					{ value: 1, color: '#27ae60' },
					{ value: -1, color: '#e74c3c' },
					{ value: 0, color: '#f39c12' }
				]
			}
		};
		const atMin = calculateColorStyles(
			unordered,
			'growth',
			{ growth: -1 },
			{ min: -100, max: 100 }
		);
		expect(atMin!.backgroundColor.toLowerCase()).toBe('#e74c3c');

		const atMax = calculateColorStyles(unordered, 'growth', { growth: 1 }, { min: -100, max: 100 });
		expect(atMax!.backgroundColor.toLowerCase()).toBe('#27ae60');
	});

	it('returns null when the value is not numeric', () => {
		const result = calculateColorStyles(
			pinned,
			'growth',
			{ growth: 'n/a' },
			{ min: -100, max: 100 }
		);
		expect(result).toBeNull();
	});

	it('falls back to the data-range gradient when fewer than two valid stops remain', () => {
		const mostlyInvalid = {
			color_options: {
				color_stops: [
					{ value: 0, color: 'not-a-color' },
					{ value: 1, color: 'also-bad' }
				]
			}
		};
		const result = calculateColorStyles(
			mostlyInvalid,
			'growth',
			{ growth: 50 },
			{ min: 0, max: 100 }
		);
		// No usable stops -> fall through to gradient (still produces a color)
		expect(result).not.toBeNull();
		expect(result!.backgroundColor).toBeTruthy();
	});

	it('takes precedence over color_scale', () => {
		const result = calculateColorStyles(
			{ color_options: { color_stops: stops, color_scale: ['#000000', '#ffffff'] } },
			'growth',
			{ growth: -1 },
			{ min: -100, max: 100 }
		);
		expect(result!.backgroundColor.toLowerCase()).toBe('#e74c3c');
	});
});

describe('calculateColorStyles diverging midpoint', () => {
	const diverging = {
		color_options: {
			color_scale: ['#d73027', '#ffffbf', '#1a9850'],
			min: -100,
			max: 100,
			midpoint: 0
		}
	};

	it('places the middle color exactly at the midpoint value', () => {
		const atMid = calculateColorStyles(diverging, 'growth', { growth: 0 }, { min: -100, max: 100 });
		expect(atMid!.backgroundColor.toLowerCase()).toBe('#ffffbf');
	});

	it('maps the extremes to the end colors of the palette', () => {
		const low = calculateColorStyles(
			diverging,
			'growth',
			{ growth: -100 },
			{ min: -100, max: 100 }
		);
		expect(low!.backgroundColor.toLowerCase()).toBe('#d73027');

		const high = calculateColorStyles(
			diverging,
			'growth',
			{ growth: 100 },
			{ min: -100, max: 100 }
		);
		expect(high!.backgroundColor.toLowerCase()).toBe('#1a9850');
	});

	it('keeps the midpoint color fixed even when the data range is skewed', () => {
		// color_options min/max (-100..100) override the data range, so 0 stays centered
		// instead of drifting toward the low end as it would in a plain [-100, 900] scale.
		const skewed = calculateColorStyles(
			diverging,
			'growth',
			{ growth: 0 },
			{ min: -100, max: 900 }
		);
		expect(skewed!.backgroundColor.toLowerCase()).toBe('#ffffbf');
	});
});

describe('calculateColorStyles min/max overrides', () => {
	const scaled = { color_options: { color_scale: ['#000000', '#ffffff'], min: 0, max: 100 } };

	it('clamps values above max to the top color', () => {
		const r = calculateColorStyles(scaled, 'v', { v: 500 }, { min: 0, max: 1000 });
		expect(r!.backgroundColor.toLowerCase()).toBe('#ffffff');
	});

	it('clamps values below min to the bottom color', () => {
		const r = calculateColorStyles(scaled, 'v', { v: -50 }, { min: -1000, max: 100 });
		expect(r!.backgroundColor.toLowerCase()).toBe('#000000');
	});
});

describe('calculateColorStyles degenerate range', () => {
	it('anchors single-value columns to the middle of the palette', () => {
		const r = calculateColorStyles(
			{ color_options: { color_scale: ['#000000', '#ffffff'] } },
			'v',
			{ v: 42 },
			{ min: 42, max: 42 }
		);
		expect(r).not.toBeNull();
		// The middle of black -> white is a grey, not either endpoint.
		expect(r!.backgroundColor.toLowerCase()).not.toBe('#000000');
		expect(r!.backgroundColor.toLowerCase()).not.toBe('#ffffff');
	});
});

describe('buildColorVizScale', () => {
	it('builds a diverging domain when midpoint + a 3-color palette are set', () => {
		const scale = buildColorVizScale(
			{
				color_options: {
					color_scale: ['#d73027', '#ffffbf', '#1a9850'],
					min: -100,
					max: 100,
					midpoint: 0
				}
			},
			{ min: -100, max: 100 }
		);
		expect(scale).not.toBeNull();
		expect(scale!.midpoint).toBe(0);
		expect(scale!.domain).toEqual([-100, 0, 100]);
	});

	it('ignores midpoint for a 2-color palette (needs 3+)', () => {
		const scale = buildColorVizScale(
			{ color_options: { color_scale: ['#000000', '#ffffff'], min: -100, max: 100, midpoint: 0 } },
			{ min: -100, max: 100 }
		);
		expect(scale!.midpoint).toBeNull();
	});

	it('falls back to the passed data range when no min/max override is given', () => {
		const scale = buildColorVizScale(
			{ color_options: { color_scale: ['#000000', '#ffffff'] } },
			{ min: 10, max: 20 }
		);
		expect(scale!.minValue).toBe(10);
		expect(scale!.maxValue).toBe(20);
	});
});

// Guards the full path a real table takes: color_stops must survive
// generatePivotData's columnMeta construction and reach calculateColorStyles.
// (A regression here renders cells with the default theme gradient instead.)
describe('color_stops through generatePivotData', () => {
	const makePCE = (alias: string, type: 'dimension' | 'measure', hasAgg: boolean) => ({
		sqlWithAlias: type === 'measure' ? `sum(${alias}) AS ${alias}` : alias,
		sqlWithoutAlias: type === 'measure' ? `sum(${alias})` : alias,
		sqlWithoutDateFiltersOrAlias: type === 'measure' ? `sum(${alias})` : alias,
		alias,
		displayAlias: alias,
		type,
		isComplexExpression: false,
		hasAgg,
		isTemporalDateGrain: false,
		hasDateGrain: false,
		hasDateRange: false,
		isTableComparison: false,
		isTableSparkline: false
	});

	const cell = (row: Record<string, unknown>): DataPoint =>
		({ ...row, __ev_render_type: 'cell_data', __ev_subtotal_level: null }) as DataPoint;

	it('preserves color_stops on the pivoted column meta and applies it', () => {
		const unifiedColumns: UnifiedColumnDefinition[] = [
			{
				type: 'dimension',
				sqlWithAlias: 'category',
				alias: 'category',
				columnIdForRendering: 'category',
				processedColumnExpression: makePCE('category', 'dimension', false)
			},
			{
				type: 'measure',
				sqlWithAlias: 'sum(total_sales) AS total_sales',
				sqlWithoutAlias: 'sum(total_sales)',
				alias: 'total_sales',
				columnIdForRendering: 'total_sales',
				processedColumnExpression: makePCE('total_sales', 'measure', true),
				viz: 'color',
				color_options: {
					color_stops: [
						{ value: 5000000, color: '#e74c3c' },
						{ value: 10000000, color: '#f39c12' },
						{ value: 15000000, color: '#27ae60' }
					],
					scale_mode: 'individual'
				}
			} as UnifiedColumnDefinition
		];

		const config: PivotConfig = {
			dimensions: ['category'],
			pivots: [],
			measures: ['total_sales'],
			measuresFirst: false,
			subtotals: false,
			showTotalRow: false,
			showSubtotalRows: false,
			columnTypes: new Map([
				['category', 'string'],
				['total_sales', 'number']
			]),
			unifiedColumns
		} as PivotConfig;

		const result = generatePivotData(
			[
				cell({ category: 'A', total_sales: 6000000 }),
				cell({ category: 'B', total_sales: 12000000 })
			],
			config
		);

		const measureMeta = result.columnMeta.find((c) => c.key === 'total_sales');
		expect(measureMeta?.color_options?.color_stops).toHaveLength(3);

		const ranges = calculateVizRanges({
			columnMeta: result.columnMeta,
			sortedRows: result.rows as never[],
			rawRows: []
		});

		const styles = (result.rows as Record<string, unknown>[]).map((r) =>
			calculateColorStyles(
				measureMeta!,
				'total_sales',
				r,
				ranges.get('total_sales') ?? { min: 0, max: 0 },
				['#dbeafe', '#1e40af']
			)
		);

		// Pinned colors, not the blue theme default — and not clamped to a single stop.
		expect(styles[0]!.backgroundColor.toLowerCase()).not.toBe('#dbeafe');
		expect(styles[0]!.backgroundColor).not.toBe(styles[1]!.backgroundColor);
	});
});
