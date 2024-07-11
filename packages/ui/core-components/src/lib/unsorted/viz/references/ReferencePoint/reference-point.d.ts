// @ts-check

import type { Writable, Readable } from 'svelte/store';
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
	labelPadding?: number;
	labelPosition?: LabelPosition;
	labelBackgroundColor?: string;
	labelBorderColor?: string;
	labelBorderWidth?: number;
	labelBorderRadius?: number;
	labelBorderType?: 'solid' | 'dotted' | 'dashed';
	fontSize?: number;
	align?: 'left' | 'center' | 'right';
	bold?: boolean;
	italic?: boolean;
	error?: string;
};

export type ReferencePointStore = Writable<ReferencePointStoreState>;

export type ReferencePointChartData = MarkPointComponentOption['data'][number] & {
	evidenceSeriesType: 'reference_point';
};
