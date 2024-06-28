// @ts-check

import type { Writable } from 'svelte/store';
import type { MarkPointComponentOption } from 'echarts';
import type { Color } from '../colors.js';

export type LabelPosition = MarkPointComponentOption['label']['position'];

export type Symbol = 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow';

export type ReferencePointStoreState = {
	data?: any;
	x?: number | string;
	y?: number | string;
	label?: string;
	symbol?: Symbol;
	color: Color;
	labelColor?: Color;
	symbolColor?: Color;
	symbolSize: number;
	labelPosition: LabelPosition;
	labelBackground: string;
	labelBorderColor?: string;
	labelBorderWidth?: number;
	labelBorderRadius?: number;
	labelBorderType?: 'solid' | 'dotted' | 'dashed';
	labelVisible: 'always' | 'hover';
};

export type ReferencePointStore = Writable<ReferencePointStoreState> & Readable<{ error?: string }>;

export type ReferencePointChartData = MarkPointComponentOption['data'][number] & {
	evidenceSeriesType: 'reference_point';
};
