import { describe, it, expect } from 'vitest';
import {
	BAR_MAX_WIDTH_PX,
	BAR_WIDTH_RATIO,
	BELOW_LABEL_ROOM_PX,
	LABEL_MIN_SIDE_PADDING_PX,
	belowLabelRoomPx,
	barCornerRadius,
	labelPlacement,
	labelsFit,
	requiredAxisFloor,
	resolveBarWidth,
	resolveSeriesStyleOverrides
} from './waterfall-layout';

describe('resolveBarWidth', () => {
	it('takes a fixed share of a narrow slot so connectors keep visible length', () => {
		expect(resolveBarWidth(50)).toBeCloseTo(50 * BAR_WIDTH_RATIO);
	});

	it('caps wide slots at the bar family max', () => {
		expect(resolveBarWidth(400)).toBe(BAR_MAX_WIDTH_PX);
	});

	it('is zero before the chart has measured', () => {
		expect(resolveBarWidth(0)).toBe(0);
		expect(resolveBarWidth(Number.NaN)).toBe(0);
	});
});

describe('labelsFit', () => {
	it('keeps labels when the widest fits inside one slot with side padding', () => {
		expect(labelsFit(40, 40 + 2 * LABEL_MIN_SIDE_PADDING_PX)).toBe(true);
		expect(labelsFit(40, 40 + 2 * LABEL_MIN_SIDE_PADDING_PX - 1)).toBe(false);
	});

	it('hides labels before the chart has measured', () => {
		expect(labelsFit(10, 0)).toBe(false);
	});
});

describe('labelPlacement', () => {
	it('puts the label at the free end of the bar', () => {
		expect(labelPlacement({ start: 0, end: 100 })).toBe('above');
		expect(labelPlacement({ start: 100, end: 60 })).toBe('below');
		expect(labelPlacement({ start: 0, end: -40 })).toBe('below');
		expect(labelPlacement({ start: 50, end: 50 })).toBe('above');
	});
});

describe('requiredAxisFloor', () => {
	const plotHeightPx = 160;
	// 160px for a 0..1000 span → BELOW_LABEL_ROOM_PX px of label room is this many units.
	const roomUnits = (BELOW_LABEL_ROOM_PX / plotHeightPx) * 1000;

	it('leaves the axis alone when no label sits below a bar', () => {
		expect(
			requiredAxisFloor({
				steps: [
					{ start: 0, end: 600 },
					{ start: 600, end: 1000 }
				],
				extentMin: 0,
				extentMax: 1000,
				plotHeightPx
			})
		).toBeUndefined();
	});

	it('leaves the axis alone when the below-label bar ends well above the floor', () => {
		expect(
			requiredAxisFloor({
				steps: [
					{ start: 0, end: 1000 },
					{ start: 1000, end: 800 }
				],
				extentMin: 0,
				extentMax: 1000,
				plotHeightPx
			})
		).toBeUndefined();
	});

	it('lowers the floor by exactly the label room when a below-label bar ends at the floor', () => {
		const floor = requiredAxisFloor({
			steps: [
				{ start: 0, end: 1000 },
				{ start: 1000, end: 0 }
			],
			extentMin: 0,
			extentMax: 1000,
			plotHeightPx
		});
		expect(floor).toBeCloseTo(-roomUnits);
	});

	it('lowers the floor only by the shortfall when the bar ends just above it', () => {
		const floor = requiredAxisFloor({
			steps: [{ start: 100, end: 40 }],
			extentMin: 0,
			extentMax: 1000,
			plotHeightPx
		});
		expect(floor).toBeCloseTo(40 - roomUnits);
		expect(floor!).toBeLessThan(0);
	});

	it('reserves more room for larger labels', () => {
		const steps = [
			{ start: 0, end: 1000 },
			{ start: 1000, end: 0 }
		];
		const small = requiredAxisFloor({ steps, extentMin: 0, extentMax: 1000, plotHeightPx })!;
		const large = requiredAxisFloor({
			steps,
			extentMin: 0,
			extentMax: 1000,
			plotHeightPx,
			labelRoomPx: belowLabelRoomPx(16)
		})!;
		expect(large).toBeLessThan(small);
		expect(large).toBeCloseTo(-(belowLabelRoomPx(16) / plotHeightPx) * 1000);
	});

	it('uses the lowest below-label bar when there are several', () => {
		const floor = requiredAxisFloor({
			steps: [
				{ start: 800, end: 300 },
				{ start: 300, end: -150 },
				{ start: 0, end: -90 }
			],
			extentMin: -150,
			extentMax: 800,
			plotHeightPx
		});
		expect(floor).toBeCloseTo(-150 - (BELOW_LABEL_ROOM_PX / plotHeightPx) * 950);
	});

	it('is a no-op before the chart has measured or with a flat extent', () => {
		const steps = [{ start: 10, end: 0 }];
		expect(
			requiredAxisFloor({ steps, extentMin: 0, extentMax: 10, plotHeightPx: 0 })
		).toBeUndefined();
		expect(requiredAxisFloor({ steps, extentMin: 0, extentMax: 0, plotHeightPx })).toBeUndefined();
	});
});

describe('resolveSeriesStyleOverrides', () => {
	it('is a no-op without overrides', () => {
		const r = resolveSeriesStyleOverrides(undefined);
		expect(r.bar).toEqual({});
		expect(r.label).toEqual({});
		expect(r.connector).toEqual({});
		expect(r.labelShow).toBe(true);
		expect(r.labelFontSize).toBeUndefined();
		expect(r.barRadius).toBeUndefined();
	});

	it('translates itemStyle to rect style and a radius override', () => {
		const r = resolveSeriesStyleOverrides({
			itemStyle: { borderColor: '#111', borderWidth: 2, opacity: 0.6, borderRadius: 4 }
		});
		expect(r.bar).toEqual({ stroke: '#111', lineWidth: 2, opacity: 0.6 });
		expect(r.barRadius).toBe(4);
	});

	it('translates label options, mapping color to fill and honoring show=false', () => {
		const r = resolveSeriesStyleOverrides({
			label: { show: false, color: '#7c3aed', fontSize: 16, fontWeight: 600 }
		});
		expect(r.label).toEqual({ fill: '#7c3aed', fontSize: 16, fontWeight: 600 });
		expect(r.labelShow).toBe(false);
		expect(r.labelFontSize).toBe(16);
	});

	it("treats label.color='inherit' as a flag rather than a fill", () => {
		const r = resolveSeriesStyleOverrides({ label: { color: 'inherit', fontSize: 12 } });
		expect(r.labelInherit).toBe(true);
		expect(r.label).toEqual({ fontSize: 12 });
		expect(resolveSeriesStyleOverrides({ label: { color: '#000' } }).labelInherit).toBe(false);
	});

	it('translates lineStyle to the connector, including dash patterns', () => {
		expect(
			resolveSeriesStyleOverrides({ lineStyle: { color: '#000', width: 2, type: 'dashed' } })
				.connector
		).toEqual({ stroke: '#000', lineWidth: 2, lineDash: [4, 4] });
		expect(resolveSeriesStyleOverrides({ lineStyle: { type: [2, 6] } }).connector).toEqual({
			lineDash: [2, 6]
		});
	});

	it('ignores malformed values', () => {
		const r = resolveSeriesStyleOverrides({ itemStyle: 'nope', label: 3, lineStyle: null });
		expect(r.bar).toEqual({});
		expect(r.label).toEqual({});
		expect(r.connector).toEqual({});
	});
});

describe('barCornerRadius', () => {
	it('rounds only the free end', () => {
		expect(barCornerRadius({ start: 0, end: 10 }, 4)).toEqual([4, 4, 0, 0]);
		expect(barCornerRadius({ start: 10, end: 2 }, 4)).toEqual([0, 0, 4, 4]);
	});

	it('is square when the theme has no radius', () => {
		expect(barCornerRadius({ start: 0, end: 10 }, 0)).toEqual([0, 0, 0, 0]);
		expect(barCornerRadius({ start: 0, end: 10 }, undefined as unknown as number)).toEqual([
			0, 0, 0, 0
		]);
	});
});
