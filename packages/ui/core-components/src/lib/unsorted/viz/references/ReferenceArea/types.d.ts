// @ts-check

import { Writable, Readable } from 'svelte/store';
import type { MarkAreaComponentOption } from 'echarts';

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

export type ReferenceAreaConfig = {
	// Data
	data?: any;
	xMin?: number | string;
	xMax?: number | string;
	yMin?: number | string;
	yMax?: number | string;
	label?: string;

	// Color
	color?: string;

	// Area styling
	areaColor?: string;
	opacity?: number;
	border?: boolean;
	borderType?: 'solid' | 'dotted' | 'dashed';
	borderColor?: string;
	borderWidth?: number;

	// Label styling
	labelColor?: string;
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
};

export type ReferenceAreaStoreValue = {
	error?: string;
};
