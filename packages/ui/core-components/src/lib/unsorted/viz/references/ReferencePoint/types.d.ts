// @ts-check

import type { Writable, Readable } from 'svelte/store';
import type { MarkPointComponentOption } from 'echarts';

import type { Symbol } from '../types.js';

export type LabelPosition = MarkPointComponentOption['label']['position'];

export type ReferencePointConfig = {
	data?: any;
	x?: number | string;
	y?: number | string;
	label?: string;
	symbol?: Symbol;
	color?: string;
	labelColor?: string;
	symbolColor?: string;
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
};

export type ReferencePointStoreValue = {
	error?: string;
};
