import { describe, expect, it, vi } from 'vitest';
import { XAxisModel } from './XAxisModel.svelte';
import type { YAxisModel } from './YAxisModel.svelte';

vi.mock('../../../../theme/theme.context.svelte', () => ({
	getThemeContext: () => ({
		activeTheme: {
			background: '#ffffff',
			mutedForeground: '#666666',
			chart: {},
			fonts: {}
		}
	})
}));

vi.mock('../../../common/card-context.svelte', () => ({
	getCardContext: () => undefined
}));

vi.mock('../../../../theme/get-theme-token', () => ({
	getThemeToken: (_theme: unknown, token: string) =>
		token === 'background' ? '#ffffff' : '#666666'
}));

function makeModel(titleArrow?: boolean): XAxisModel {
	const emptyAxis = { series: [] } as unknown as YAxisModel;
	return new XAxisModel(
		() => ({ x: 'date', title: 'Order date', title_arrow: titleArrow }),
		() => ({ y1: emptyAxis, y2: emptyAxis })
	);
}

function titleText(model: XAxisModel): string {
	const graphic = model.axisTitleGraphic as { style: { text: string } };
	return graphic.style.text;
}

describe('x-axis title', () => {
	it('uses the arrow glyph bundled with Geist by default', () => {
		expect(titleText(makeModel())).toBe('Order date →');
	});

	it('omits the arrow when title_arrow is false', () => {
		expect(titleText(makeModel(false))).toBe('Order date');
	});
});
