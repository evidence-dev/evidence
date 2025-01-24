// @ts-check

import { Writable, Readable } from 'svelte/store';

import type { Symbol } from '../types.js';
import type { MarkLineComponentOption } from 'echarts';

export type LabelPosition =
	| 'aboveStart'
	| 'aboveCenter'
	| 'aboveEnd'
	| 'belowStart'
	| 'belowCenter'
	| 'belowEnd';

export type ReferenceLineConfig = {
	// Data
	data?: any;
	x?: number | string;
	y?: number | string;
	x2?: number | string;
	y2?: number | string;
	label?: string;

	// Color
	color?: string;

	// Symbol styling
	symbolStart?: Symbol;
	symbolStartSize?: number;
	symbolEnd?: Symbol;
	symbolEndSize?: number;

	// Line styling
	lineType?: 'solid' | 'dotted' | 'dashed';
	lineColor?: string;
	lineWidth?: number;

	// Label styling
	labelColor?: string;
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
};

export type ReferenceLineStoreValue = {
	error?: string;
};
