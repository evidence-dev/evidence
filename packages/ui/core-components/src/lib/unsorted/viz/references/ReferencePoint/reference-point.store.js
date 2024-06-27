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
	const store = writable();

	const id = nanoid();

	/** @param {import('./reference-point.d.ts').ReferencePointStoreState} state */
	const set = (state) => {
		const { labelColor, symbolColor } = getLineAndSymbolColors(state);

		const { data, x, y, label, labelVisible } = state;

		/** @type {Partial<import('echarts').MarkPointComponentOption['data'][number]>} */
		const seriesDataCommon = {
			// Override arrow symbol with a nicer path
			symbol: state.symbol === 'arrow' ? 'path://M0,10 L5,0 L10,10 z' : state.symbol,
			symbolKeepAspect: true,
			symbolSize: state.symbolSize,
			itemStyle: {
				color: symbolColor
			}
		};

		/** @type {import('echarts').MarkPointComponentOption['data'][number][]} */
		let seriesData = [];
		if (
			typeof data !== 'undefined' &&
			data[Symbol.iterator] &&
			typeof x !== 'undefined' &&
			typeof y !== 'undefined'
		) {
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
		} else if (typeof x !== 'undefined' && typeof y !== 'undefined') {
			seriesData.push({
				...seriesDataCommon,
				coord: [x, y],
				name: label,
				value: label
			});
		} else {
			// Log here saying user must provide data or x/y?
		}

		/** @type {import('echarts').LineSeriesOption['markPoint']['label']} */
		const labelStyle = {
			position: state.labelPosition,
			color: labelColor,
			backgroundColor: state.labelBackground
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
			console.log(config);
			return config;
		});
	};

	return {
		subscribe: store.subscribe,
		set,
		update: (cb) => {
			const updatedStore = cb(get(store));
			set(updatedStore);
		}
	};
};
