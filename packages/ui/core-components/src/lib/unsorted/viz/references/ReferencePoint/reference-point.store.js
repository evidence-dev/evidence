// @ts-check

import { get, writable } from 'svelte/store';
import { nanoid } from 'nanoid';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';
import { isPresetColor } from '../types.js';
import { COLORS } from './constants.js';

/**
 * @param {import('svelte/store').Writable<any>} propsStore
 * @param {import('svelte/store').Writable<any>} configStore
 * @returns {import('./reference-point.d.ts').ReferencePointStore}
 */
export const createReferencePointStore = (propsStore, configStore) => {
	/** @type {import('./reference-point.d.ts').ReferencePointStore} */
	const store = writable({});

	/** @param {string | undefined} error */
	const setError = (error) => store.update((state) => ({ ...state, error }));
	const clearError = () => setError(undefined);

	const id = nanoid();

	/** @param {import('./reference-point.d.ts').ReferencePointStoreValue} value */
	const updateChartConfig = (value) => {
		// Destructure some properties for QOL preprocessing
		let {
			data,
			x,
			y,
			color,
			symbol,
			symbolSize,
			symbolColor,
			label,
			labelColor,
			labelPosition,
			labelBorderWidth,
			labelBorderColor,
			symbolBorderWidth,
			symbolBorderColor,
			align
		} = value;

		const props = get(propsStore);
		if (typeof props === 'undefined') {
			throw new Error('Reference Point cannot be used outside of a chart');
		}

		if (props.swapXY) {
			[x, y] = [y, x];
		}

		if (symbol === 'arrow') {
			// Use a nicer arrow symbol
			symbol = 'path://M0,10 L5,0 L10,10 z';
		} else if (symbol === 'none') {
			// using symbol=none removes the label, which we dont want
			// so we set symbolSize=0 instead
			symbol = undefined;
			symbolSize = 0;
		}

		// Use preset colors
		labelColor = labelColor ?? color;
		symbolColor = symbolColor ?? color;
		if (isPresetColor(color)) {
			if (!labelColor) labelColor = COLORS[color].labelColor;
			if (!symbolColor) symbolColor = COLORS[color].symbolColor;
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

		/** @type {Partial<NonNullable<import('echarts').MarkPointComponentOption['data']>[number]>} */
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

		/** @type {NonNullable<import('echarts').MarkPointComponentOption['data']>[number][]} */
		let seriesData = [];
		if (typeof x !== 'undefined' && typeof y !== 'undefined') {
			if (typeof data !== 'undefined' && data[Symbol.iterator]) {
				checkInputs(data, [x, y]);
				for (let i = 0; i < data.length; i++) {
					seriesData.push({
						...seriesDataCommon,
						coord: [data[i][x], data[i][y]],
						name: (label ? data[i][label] : undefined) ?? label,
						value: (label ? data[i][label] : undefined) ?? label
					});
				}
			} else {
				seriesData.push({
					...seriesDataCommon,
					coord: [x, y],
					name: label ?? id,
					value: label
				});
			}
		} else {
			throw new Error('You must provide x and y');
		}

		/** @type {import('echarts').LineSeriesOption & { evidenceSeriesType: 'reference_point' }} */
		const series = {
			evidenceSeriesType: 'reference_point',
			id,
			type: 'line',
			animation: false,
			silent: true,
			markPoint: {
				data: seriesData,
				label: {
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
				},
				emphasis: {
					disabled: true
				}
			}
		};

		configStore.update((config) => {
			const existingDataIndex = config.series.findIndex(
				(/** @type {{ id?: string; }} */ series) => series.id === id
			);
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
			clearError();
			try {
				updateChartConfig(state);
			} catch (e) {
				setError(String(e));
			}
		},
		update: (cb) => {
			clearError();
			let state = get(store);
			try {
				state = cb(state);
				updateChartConfig(state);
			} catch (e) {
				setError(String(e));
			}
		}
	};
};
