import { describe, expect, it } from 'vitest';
import { isRecognizedDateRange } from '../../common/date-options';
import { gregorianCalendar, rangeFitsGrain } from '../../common/period-calendar';
import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';
import { presetsForGrain, selectionLabel } from './grain-ui';

const GRAINS = ['week', 'month', 'quarter', 'year'] as const;
const ANCHORS = ['2025-01-01', '2025-02-14', '2025-06-30', '2026-11-02', '2026-12-31'].map(
	parseDateStringAsLocalMidnight
);

describe('presetsForGrain', () => {
	it.each(GRAINS)('offers only presets that parse and line up at %s grain', (grain) => {
		const presets = presetsForGrain(grain);
		expect(presets.at(-1)).toEqual({ key: 'all time', label: 'All Time' });
		for (const { key, label } of presets) {
			expect(isRecognizedDateRange(key), key).toBe(true);
			expect(label).toMatch(/^[A-Z]/);
			for (const firstDayOfWeek of ['sunday', 'monday'] as const) {
				for (const anchor of ANCHORS) {
					expect(rangeFitsGrain(key, grain, anchor, firstDayOfWeek), `${key} @ ${anchor}`).toBe(
						true
					);
				}
			}
		}
	});

	it('labels generated presets in title case', () => {
		expect(presetsForGrain('week').map((p) => p.label)).toContain('Previous 13 Weeks');
	});
});

describe('selectionLabel', () => {
	const sunday = gregorianCalendar('sunday');

	it('names one period, or the first and last periods of a range', () => {
		expect(selectionLabel({ start: '2025-03-01', end: '2025-03-31' }, 'month', sunday)).toBe(
			'Mar 2025'
		);
		expect(selectionLabel({ start: '2024-10-01', end: '2025-03-31' }, 'quarter', sunday)).toBe(
			'Q4 2024 – Q1 2025'
		);
		expect(selectionLabel({ start: '2020-01-01', end: '2022-12-31' }, 'year', sunday)).toBe(
			'2020 – 2022'
		);
	});

	it('names a single week by its start, and several weeks by their dates', () => {
		expect(selectionLabel({ start: '2026-11-01', end: '2026-11-07' }, 'week', sunday)).toBe(
			'Week of Nov 1, 2026'
		);
		expect(selectionLabel({ start: '2026-11-01', end: '2026-11-21' }, 'week', sunday)).toBe(
			'Nov 1, 2026 – Nov 21, 2026'
		);
		const monday = gregorianCalendar('monday');
		expect(selectionLabel({ start: '2026-11-02', end: '2026-11-08' }, 'week', monday)).toBe(
			'Week of Nov 2, 2026'
		);
	});

	it('labels open-ended ranges', () => {
		expect(selectionLabel({ start: '2021-01-01' }, 'year', sunday)).toBe('From 2021');
		expect(selectionLabel({ end: '2025-06-30' }, 'quarter', sunday)).toBe('Until Q2 2025');
		expect(selectionLabel({ start: '2026-11-01' }, 'week', sunday)).toBe('From Nov 1, 2026');
		expect(selectionLabel({}, 'month', sunday)).toBeUndefined();
	});
});
