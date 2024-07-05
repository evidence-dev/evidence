// @ts-check

import { Writable, Readable } from 'svelte/store';

import type { Color, Symbol } from '../types.js';
import type { MarkLineComponentOption } from 'echarts';

export type LabelPosition =
	| 'aboveStart'
	| 'aboveCenter'
	| 'aboveEnd'
	| 'belowStart'
	| 'belowCenter'
	| 'belowEnd';

export type ReferenceLineStoreValue = {
	// Data
	data?: any;
	x?: number | string;
	y?: number | string;
	x2?: number | string;
	y2?: number | string;
	label?: string;

	// Color
	color?: Color;

	// Line styling
	lineType?: 'solid' | 'dotted' | 'dashed';
	lineColor?: Color;
	lineWidth?: number;
	symbol?: Symbol;
	symbolSize?: number;

	// Label styling
	labelColor?: Color;
	labelPadding?: number;
	labelPosition?: LabelPosition;
	labelBackgroundColor?: string;
	labelBorderColor?: string;
	labelBorderWidth?: number;
	labelBorderRadius?: number;
	labelBorderType?: 'solid' | 'dotted' | 'dashed';
	hideValue?: boolean;
	fontSize?: number;
	align?: 'left' | 'center' | 'right';
	bold?: boolean;
	italic?: boolean;

	error?: string;
};

export type ReferenceLineStore = Writable<ReferenceLineStoreValue>;

export type ReferenceLineChartData = MarkLineComponentOption['data'][number] & {
	evidenceSeriesType: 'reference_line';
};
