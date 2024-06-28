// @ts-check

import type { Writable } from 'svelte/store';
import type { MarkPointComponentOption } from 'echarts';
import type { Color } from '../colors.js';

export type LabelPosition = MarkPointComponentOption['label']['position'];

export type Symbol =
	| 'circle'
	| 'rect'
	| 'roundRect'
	| 'triangle'
	| 'diamond'
	| 'pin'
	| 'arrow'
	| 'none';

export type ReferencePointStoreState = {
	data?: any;
	x?: number | string;
	y?: number | string;
	label?: string;
	symbol?: Symbol;
	color?: Color;
	labelColor?: Color;
	symbolColor?: Color;
	symbolSize?: number;
	symbolOpacity?: number;
	symbolBorderWidth?: number;
	symbolBorderColor?: string;
	labelWidth?: number;
	labelPosition?: LabelPosition;
	labelBackgroundColor?: string;
	labelBorderColor?: string;
	labelBorderWidth?: number;
	labelBorderRadius?: number;
	labelBorderType?: 'solid' | 'dotted' | 'dashed';
	labelVisible: 'always' | 'hover';
	fontSize?: number;
	align?: 'left' | 'center' | 'right';
	bold?: boolean;
	italic?: boolean;
};

export type ReferencePointStore = Writable<ReferencePointStoreState> & Readable<{ error?: string }>;

export type ReferencePointChartData = MarkPointComponentOption['data'][number] & {
	evidenceSeriesType: 'reference_point';
};
