// @ts-check

import { get, writable } from 'svelte/store';
import { nanoid } from 'nanoid';
import { getLineAndSymbolColors } from '../colors.js';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';

/**
 * @param {import('svelte/store').Writable<any>} configStore
 * @returns {import('./reference-point.d.ts').ReferencePointStore}
 */
export const createReferencePointStore = (configStore) => {
	/** @type {import('./reference-point.d.ts').ReferencePointStore} */
	const store = writable({});

	const id = nanoid();

	/** @param {import('./reference-point.d.ts').ReferencePointStoreValue} value */
	const set = (value) => {
		const { labelColor, symbolColor } = getLineAndSymbolColors(value);

		// Destructure some properties for QOL preprocessing
		let {
			symbolSize,
			label,
			labelPosition,
			labelBorderWidth,
			labelBorderColor,
			symbolBorderWidth,
			symbolBorderColor,
			labelVisible,
			align
		} = value;

		/** @type {string} */
		let symbol = value.symbol;
		if (symbol === 'arrow') {
			// Use a nicer arrow symbol
			symbol = 'path://M0,10 L5,0 L10,10 z';
		} else if (symbol === 'none') {
			// using symbol=none removes the label, which we dont want
			// so we set symbolSize=0 instead
			symbol = undefined;
			symbolSize = 0;
		}

		// Default labelBorderWidth and labelBorderColor if only one is given
		if (labelBorderColor && typeof labelBorderWidth === 'undefined') {
			labelBorderWidth = 1;
		} else if (labelBorderWidth && !labelBorderColor) {
			labelBorderColor = 'gray';
		}

		// Default symbolBorderWidth and symbolBorderColor if only one is given
		if (symbolBorderColor && typeof symbolBorderWidth === 'undefined') {
			symbolBorderWidth = 1;
		} else if (symbolBorderWidth && !symbolBorderColor) {
			symbolBorderColor = 'gray';
		}

		/** @type {Partial<import('echarts').MarkPointComponentOption['data'][number]>} */
		const seriesDataCommon = {
			symbol,
			symbolSize,
			symbolKeepAspect: true,
			itemStyle: {
				color: symbolColor,
				opacity: value.symbolOpacity,
				borderWidth: value.symbolBorderWidth,
				borderColor: value.symbolBorderColor
			}
		};

		const { data, x, y } = value;
		/** @type {import('echarts').MarkPointComponentOption['data'][number][]} */
		let seriesData = [];
		if (typeof x !== 'undefined' && typeof y !== 'undefined') {
			if (typeof data !== 'undefined' && data[Symbol.iterator]) {
				checkInputs(data, [x, y]);
				for (let i = 0; i < data.length; i++) {
					seriesData.push({
						...seriesDataCommon,
						coord: [data[i][x], data[i][y]],
						name: data[i][label] ?? label,
						value: data[i][label] ?? label
					});
				}
			} else {
				seriesData.push({
					...seriesDataCommon,
					coord: [x, y],
					name: label,
					value: label
				});
			}
		} else {
			throw new Error('x and y required');
		}

		/** @type {import('echarts').LineSeriesOption['markPoint']['label']} */
		const labelStyle = {
			width: value.labelWidth,
			padding: value.labelPadding,
			position: labelPosition,
			color: labelColor,
			opacity: 1,
			backgroundColor: value.labelBackgroundColor,
			borderColor: value.labelBorderColor,
			borderWidth: value.labelBorderWidth,
			borderRadius: value.labelBorderRadius,
			borderType: value.labelBorderType,
			overflow: 'break',
			fontSize: value.fontSize,
			align,
			fontWeight: value.bold ? 'bold' : undefined,
			fontStyle: value.italic ? 'italic' : undefined
		};

		/** @type {import('echarts').LineSeriesOption & { evidenceSeriesType: 'reference_point' }} */
		const series = {
			evidenceSeriesType: 'reference_point',
			id,
			type: 'line',
			animation: false,
			markPoint: {
				data: seriesData,
				silent: false,
				label: {
					show: labelVisible === 'always',
					...labelStyle
				},
				emphasis: {
					label: {
						show: true,
						...labelStyle
					}
				}
			}
		};

		configStore.update((config) => {
			const existingDataIndex = config.series.findIndex((series) => series.id === id);
			if (existingDataIndex === -1) {
				config.series.push(series);
			} else {
				config.series[existingDataIndex] = series;
			}
			return config;
		});
	};

	return {
		subscribe: store.subscribe,
		set: (value) => {
			store.set({ error: undefined });
			try {
				set(value);
			} catch (e) {
				store.set({ error: e });
			}
		},
		update: (cb) => {
			const updatedStore = cb(get(store));
			set(updatedStore);
		}
	};
};
