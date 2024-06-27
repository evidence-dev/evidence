// @ts-check

import type { Writable } from 'svelte/store';
import type { MarkPointComponentOption } from 'echarts';
import type { Color } from '../colors.js';

export type LabelPosition = MarkPointComponentOption['label']['position'];

export type Symbol = 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow';

export type ReferencePointStoreState = {
	x?: number;
	y?: number;
	label?: string;
	symbol?: Symbol;
	color: Color;
	labelColor?: Color;
	symbolColor?: Color;
	symbolSize: number;
	labelPosition: LabelPosition;
	labelBackground: string;
};

export type ReferencePointStore = Writable<ReferencePointStoreState>;

export type ReferencePointChartData = MarkPointComponentOption['data'][number] & {
	evidenceSeriesType: 'reference_point';
};
