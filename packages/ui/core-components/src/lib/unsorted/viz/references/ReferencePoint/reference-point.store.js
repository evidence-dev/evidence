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

	/** @param {string | undefined} error */
	const setError = (error) => store.update((state) => ({ ...state, error }));
	const clearError = () => setError(undefined);

	const id = nanoid();

	/** @param {import('./reference-point.d.ts').ReferencePointStoreState} state */
	const updateChartConfig = (state) => {
		const { labelColor, symbolColor } = getLineAndSymbolColors(state);

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
		} = state;

		/** @type {import('./reference-point.d.ts').Symbol | string | undefined} */
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

		/** @type {Partial<NonNullable<import('echarts').MarkPointComponentOption['data']>[number]>} */
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
					show: labelVisible === 'always',
					width: state.labelWidth,
					padding: state.labelPadding,
					position: labelPosition,
					color: labelColor,
					opacity: 1,
					backgroundColor: state.labelBackgroundColor,
					borderColor: state.labelBorderColor,
					borderWidth: state.labelBorderWidth,
					borderRadius: state.labelBorderRadius,
					borderType: state.labelBorderType,
					overflow: 'break',
					fontSize: state.fontSize,
					align,
					fontWeight: state.bold ? 'bold' : undefined,
					fontStyle: state.italic ? 'italic' : undefined
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
