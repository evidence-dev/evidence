import { describe, it, expect } from 'vitest';
import {
	formatPercentOfFirst,
	pickLabelTextColor,
	parseFunnelSize,
	estimateSegmentWidthPx,
	measureFunnelLabelWidth,
	resolveAutoLabelPlacement,
	sanitizeRichText
} from './funnel-labels';

describe('sanitizeRichText', () => {
	it('drops the rich-text block delimiter', () => {
		expect(sanitizeRichText('Revenue > $0}')).toBe('Revenue > $0');
	});

	it('collapses newlines to spaces', () => {
		expect(sanitizeRichText('Added\nto\r\nCart')).toBe('Added to Cart');
	});

	it('leaves ordinary names untouched', () => {
		expect(sanitizeRichText('Started Checkout')).toBe('Started Checkout');
	});
});

describe('formatPercentOfFirst', () => {
	it('trims trailing .0', () => {
		expect(formatPercentOfFirst(100, 100)).toBe('100%');
		expect(formatPercentOfFirst(62, 100)).toBe('62%');
	});

	it('keeps meaningful decimals', () => {
		expect(formatPercentOfFirst(37.5, 100)).toBe('37.5%');
		expect(formatPercentOfFirst(619, 1000)).toBe('61.9%');
	});

	it('returns empty string when the first stage is 0', () => {
		expect(formatPercentOfFirst(5, 0)).toBe('');
		expect(formatPercentOfFirst(0, 0)).toBe('');
	});
});

describe('pickLabelTextColor', () => {
	it('uses white text on dark fills', () => {
		expect(pickLabelTextColor('#236aa4')).toBe('#ffffff');
	});

	it('uses black text on light fills', () => {
		expect(pickLabelTextColor('#a5cdee')).toBe('#000000');
	});

	it('falls back to black for invalid colors', () => {
		expect(pickLabelTextColor('not-a-color')).toBe('#000000');
	});
});

describe('parseFunnelSize', () => {
	it('resolves percentages against the series width', () => {
		expect(parseFunnelSize('25%', 800, 0)).toBe(200);
	});

	it('treats bare numbers as pixels', () => {
		expect(parseFunnelSize('120', 800, 0)).toBe(120);
		expect(parseFunnelSize(90, 800, 0)).toBe(90);
	});

	it('falls back to the given fraction when unparseable or missing', () => {
		expect(parseFunnelSize('wide', 800, 1)).toBe(800);
		expect(parseFunnelSize(undefined, 800, 0)).toBe(0);
	});
});

describe('estimateSegmentWidthPx', () => {
	it('maps values linearly onto [minSize, maxSize]', () => {
		expect(estimateSegmentWidthPx({ value: 50, maxValue: 100, seriesWidthPx: 800 })).toBe(400);
		expect(
			estimateSegmentWidthPx({
				value: 50,
				maxValue: 100,
				seriesWidthPx: 800,
				minSize: '10%',
				maxSize: '90%'
			})
		).toBe(400);
	});

	it('never goes below minSize', () => {
		expect(
			estimateSegmentWidthPx({
				value: 0,
				maxValue: 100,
				seriesWidthPx: 800,
				minSize: '10%'
			})
		).toBe(80);
	});

	it('returns maxSize when there is no positive max value', () => {
		expect(estimateSegmentWidthPx({ value: 0, maxValue: 0, seriesWidthPx: 800 })).toBe(800);
	});
});

describe('measureFunnelLabelWidth', () => {
	const font = 'Inter, sans-serif';

	it('sums name and value on one line, exceeding the stacked (max) width', () => {
		// Short segments render "{name}  {value}" on a single line; measuring the
		// max of the two would undersize the outside rail and clip the label.
		const stacked = measureFunnelLabelWidth('Groceries', '308k', font);
		const oneLine = measureFunnelLabelWidth('Groceries', '308k', font, true);
		expect(oneLine).toBeGreaterThan(stacked);
	});

	it('ignores singleLine when there is no name (value-only label)', () => {
		expect(measureFunnelLabelWidth('', '308k', font, true)).toBe(
			measureFunnelLabelWidth('', '308k', font, false)
		);
	});
});

describe('resolveAutoLabelPlacement', () => {
	const base = {
		nameText: 'Purchased',
		valueText: '120 (12%)',
		fontFamily: 'Inter, sans-serif'
	} as const;

	it('keeps the label inside wide segments, anchored to the funnel alignment', () => {
		expect(resolveAutoLabelPlacement({ ...base, segmentWidthPx: 400, align: 'left' })).toEqual({
			inside: true,
			position: 'insideLeft'
		});
		expect(resolveAutoLabelPlacement({ ...base, segmentWidthPx: 400, align: 'center' })).toEqual({
			inside: true,
			position: 'inside'
		});
		expect(resolveAutoLabelPlacement({ ...base, segmentWidthPx: 400, align: 'right' })).toEqual({
			inside: true,
			position: 'insideRight'
		});
	});

	it('moves the label beside segments that are too narrow', () => {
		expect(resolveAutoLabelPlacement({ ...base, segmentWidthPx: 40, align: 'left' })).toEqual({
			inside: false,
			position: 'right'
		});
		expect(resolveAutoLabelPlacement({ ...base, segmentWidthPx: 40, align: 'center' })).toEqual({
			inside: false,
			position: 'right'
		});
	});

	it('puts outside labels on the left for right-aligned funnels', () => {
		expect(resolveAutoLabelPlacement({ ...base, segmentWidthPx: 40, align: 'right' })).toEqual({
			inside: false,
			position: 'left'
		});
	});
});
