import { describe, test, expect } from 'vitest';
import type { EChartsOption } from 'echarts';
import { getOptionsForEnvironment } from './echarts.action';

// Charts hardcode option-level animationDuration (e.g. 800), which wins over the
// registered theme — so the chart.animateIntro / chart.animateUpdates toggles are
// honored here, at the single option-application chokepoint. These assert the
// real override (the mechanism that actually makes the toggles work).
describe('getOptionsForEnvironment — chart animation toggles', () => {
	const base = (): EChartsOption =>
		({
			animation: true,
			animationDuration: 800,
			animationDurationUpdate: 500,
			series: [{ type: 'bar', animationDuration: 800, animationDurationUpdate: 500 }]
		}) as unknown as EChartsOption;

	test('undefined flags leave animation config untouched and never pin useUTC', () => {
		const input = base();
		const result = getOptionsForEnvironment(input, false, undefined, undefined);
		// Animation fields are pass-through when both toggles are undefined
		expect(result).toMatchObject({
			animation: true,
			animationDuration: 800,
			animationDurationUpdate: 500,
			series: [{ type: 'bar', animationDuration: 800, animationDurationUpdate: 500 }]
		});
		// ECharts is left on its default local-time clock: series positions and
		// our tick math + label formatters all parse date strings locally, so a
		// zoneless calendar date renders verbatim for every viewer. Guard against
		// a UTC pin sneaking back in (it would desync labels from positions).
		expect((result as { useUTC?: boolean }).useUTC).toBeUndefined();
	});

	test('animateIntro:false zeroes intro durations at the option + series level', () => {
		const opts = getOptionsForEnvironment(base(), false, false, undefined) as unknown as {
			animationDuration: number;
			animationDurationUpdate: number;
			series: Array<{ animationDuration: number; animationDurationUpdate: number }>;
		};
		expect(opts.animationDuration).toBe(0);
		expect(opts.series[0].animationDuration).toBe(0);
		// update animation is left alone when only intro is off
		expect(opts.animationDurationUpdate).toBe(500);
		expect(opts.series[0].animationDurationUpdate).toBe(500);
	});

	test('animateUpdates:false zeroes update durations only', () => {
		const opts = getOptionsForEnvironment(base(), false, undefined, false) as unknown as {
			animationDuration: number;
			animationDurationUpdate: number;
			series: Array<{ animationDuration: number; animationDurationUpdate: number }>;
		};
		expect(opts.animationDurationUpdate).toBe(0);
		expect(opts.series[0].animationDurationUpdate).toBe(0);
		expect(opts.animationDuration).toBe(800);
	});

	test('does not mutate the input options', () => {
		const input = base();
		getOptionsForEnvironment(input, false, false, false);
		expect((input as unknown as { animationDuration: number }).animationDuration).toBe(800);
		expect(
			(input as unknown as { series: Array<{ animationDuration: number }> }).series[0]
				.animationDuration
		).toBe(800);
	});

	test('print mode forces all animation off regardless of toggles', () => {
		const opts = getOptionsForEnvironment(base(), true) as unknown as {
			animation: boolean;
			animationDuration: number;
		};
		expect(opts.animation).toBe(false);
		expect(opts.animationDuration).toBe(0);
	});
});
