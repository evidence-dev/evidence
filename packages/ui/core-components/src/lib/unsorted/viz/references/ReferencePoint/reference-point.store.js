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

	/** @param {import('./reference-point.d.ts').ReferencePointStoreState} state */
	const set = (state) => {
		const { labelColor, symbolColor } = getLineAndSymbolColors(state);

		// Destructure some properties for QOL preprocessing
		let {
			symbolSize,
			label,
			labelBorderWidth,
			labelBorderColor,
			symbolBorderWidth,
			symbolBorderColor,
			labelVisible
		} = state;

		// Parse string size
		if (typeof symbolSize === 'string') symbolSize = parseFloat(symbolSize);

		/** @type {string} */
		let symbol = state.symbol;
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
				opacity: state.symbolOpacity,
				borderWidth: state.symbolBorderWidth,
				borderColor: state.symbolBorderColor
			}
		};

		const { data, x, y } = state;
		/** @type {import('echarts').MarkPointComponentOption['data'][number][]} */
		let seriesData = [];
		if (typeof x !== 'undefined' && typeof y !== 'undefined') {
			if (typeof data !== 'undefined' && data[Symbol.iterator]) {
				checkInputs(data, [x, y]);
				for (let i = 0; i < data.length; i++) {
					console.log(data[i]);
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
			width: state.labelWidth,
			position: state.labelPosition,
			color: labelColor,
			opacity: 1,
			backgroundColor: state.labelBackground,
			borderColor: state.labelBorderColor,
			borderWidth: state.labelBorderWidth,
			borderRadius: state.labelBorderRadius,
			borderType: state.labelBorderType,
			overflow: 'break',
			fontSize: state.fontSize,
			align: state.align,
			fontWeight: state.bold ? 'bold' : undefined,
			fontStyle: state.italic ? 'italic' : undefined
		};

		/** @type {import('echarts').LineSeriesOption & { evidenceSeriesType: 'reference_point' }} */
		const series = {
			evidenceSeriesType: 'reference_point',
			id,
			type: 'line',
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
		set: (state) => {
			try {
				set(state);
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
