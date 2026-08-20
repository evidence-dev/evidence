import { describe, expect, it } from 'vitest';
import type { XAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel.js';
import { XAxisModel } from './XAxisModel.svelte';
import type { YAxisModel } from './YAxisModel.svelte';
import { FLOATING_CHAT_CHART_TOOLTIP_Z_INDEX } from '../../../common/chart-tooltip-elevation';

/**
 * The axis-label tooltip (shown when a long x/category label is truncated)
 * shares ECharts' body-appended tooltip element, so it needs the same
 * floating-chat-pane elevation as chart-area tooltips: inside the pane its
 * z-index must beat the pane, everywhere else it keeps ECharts' page stacking.
 */
function makeModel(
	elevatedTooltipCssGetter?: () => string,
	category = 'a-very-long-category-label-that-truncates'
): XAxisModel {
	const rows = [
		{ category, value: 1 },
		{ category: 'another-very-long-category-label', value: 2 }
	];
	const columns = [
		{ name: 'category', jsType: 'string' },
		{ name: 'value', jsType: 'number' }
	];
	const stubAxis = {
		series: [{ query: { result: { rows, columns } } }]
	} as unknown as YAxisModel;
	const emptyAxis = { series: [] } as unknown as YAxisModel;
	return new XAxisModel(
		() => ({ x: 'category', max_label_length: 10 }),
		() => ({ y1: stubAxis, y2: emptyAxis }),
		elevatedTooltipCssGetter
	);
}

function tooltipCss(config: XAXisOption): string {
	const tooltip = config.tooltip as { extraCssText?: string } | undefined;
	return tooltip?.extraCssText ?? '';
}

describe('x-axis label tooltip elevation', () => {
	it('keeps ECharts page stacking (z-index: 1) with no elevation getter', () => {
		const css = tooltipCss(makeModel().axisConfig);
		expect(css).toContain('z-index: 1;');
		// No higher z-index — page/editor tooltips stay below the chat pane.
		expect(css).not.toContain(`z-index: ${FLOATING_CHAT_CHART_TOOLTIP_Z_INDEX}`);
	});

	it('appends the elevation z-index AFTER the default so it wins inside the pane', () => {
		const elevatedCss = `z-index: ${FLOATING_CHAT_CHART_TOOLTIP_Z_INDEX};`;
		const css = tooltipCss(makeModel(() => elevatedCss).axisConfig);

		const defaultIdx = css.indexOf('z-index: 1;');
		const elevatedIdx = css.indexOf(elevatedCss);
		expect(defaultIdx).toBeGreaterThanOrEqual(0);
		expect(elevatedIdx).toBeGreaterThan(defaultIdx);
	});

	it('escapes truncated category values rendered by the HTML tooltip', () => {
		const tooltip = makeModel(undefined, '<img src=x onerror=alert(1)>').axisConfig.tooltip as
			| {
					formatter?: (params: { name: string; isTruncated: () => boolean }) => string;
			  }
			| undefined;
		const formatter = tooltip?.formatter as (params: {
			name: string;
			isTruncated: () => boolean;
		}) => string;

		expect(formatter({ name: '<img src=x onerror=alert(1)>', isTruncated: () => true })).toBe(
			'&lt;img src=x onerror=alert(1)&gt;'
		);
	});
});
