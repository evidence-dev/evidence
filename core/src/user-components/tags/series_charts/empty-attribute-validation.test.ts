import { describe, it, expect } from 'vitest';
import { process } from '../../Renderer/MarkdocProcessor/process-markdoc';

/**
 * Regression: the series charts embed `comboChartSchema.validate` (which already
 * runs `validateEmptyAttributes`) AND used to add their own top-level
 * `validateEmptyAttributes()` call, so an empty required attribute in raw mode
 * was reported twice (e.g. "bar_chart: data cannot be empty" appeared twice).
 */

const emptyAttributeMessages = (markdown: string): string[] =>
	process(markdown)
		.validationErrors.filter((e) => e.error?.id === 'empty-attribute')
		.map((e) => e.error.message);

describe('series chart empty-attribute validation is not duplicated', () => {
	const rawCharts = ['bar_chart', 'area_chart', 'line_chart', 'scatter_chart', 'bubble_chart'];

	for (const tag of rawCharts) {
		it(`${tag}: reports data/x/y empty exactly once each (none dropped, none duplicated)`, () => {
			const messages = emptyAttributeMessages(`{% ${tag} data="" x="" y="" /%}`).sort();
			// Exact set — a dropped required check OR a duplicate both fail this.
			expect(messages).toEqual([
				`${tag}: data cannot be empty`,
				`${tag}: x cannot be empty`,
				`${tag}: y cannot be empty`
			]);
		});
	}

	// Coverage must not be lost when the raw-path branch is gated out. bar/area/line
	// gate the embedded (raw) check behind `notMetric`; the top-level check is gated
	// behind `isMetric`. An empty-array `metric` is truthy → raw branch is skipped →
	// the top-level check is the ONLY thing that can catch it. If the gate were wrong
	// this would silently pass an empty metric.
	for (const tag of ['bar_chart', 'area_chart', 'line_chart']) {
		it(`${tag}: still flags an empty metric array in metric mode (exactly once)`, () => {
			const messages = emptyAttributeMessages(`{% ${tag} metric=[] /%}`);
			expect(messages).toContain(`${tag}: metric cannot be empty`);
			expect(messages.filter((m) => m === `${tag}: metric cannot be empty`)).toHaveLength(1);
		});
	}
});
