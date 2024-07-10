// @ts-check

import { Writable, Readable } from 'svelte/store';
import type { MarkAreaComponentOption } from 'echarts';

import type { Color } from '../colors.js';
import type { Symbol } from '../references.d.ts';

export type LabelPosition =
	| 'topLeft'
	| 'top'
	| 'topRight'
	| 'bottomLeft'
	| 'bottom'
	| 'bottomRight'
	| 'left'
	| 'center'
	| 'right';

export type ReferenceAreaStoreValue = {
	// Data
	data?: any;
	xMin?: number | string;
	xMax?: number | string;
	yMin?: number | string;
	yMax?: number | string;
	label?: string;

	// Color
	color?: Color;

	// Area styling
	areaColor?: Color;
	opacity?: number;
	border?: boolean;
	borderType?: 'solid' | 'dotted' | 'dashed';
	borderColor?: Color;
	borderWidth?: number;

	// Label styling
	labelColor?: Color;
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

export type ReferenceAreaStore = Writable<ReferenceAreaStoreValue>;

export type ReferenceAreaChartData = MarkAreaComponentOption['data'][number] & {
	evidenceSeriesType: 'reference_area';
};
