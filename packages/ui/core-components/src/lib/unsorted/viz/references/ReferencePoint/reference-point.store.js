// @ts-check

import { get, writable } from 'svelte/store';
import { nanoid } from 'nanoid';
import { getLineAndSymbolColors } from '../colors.js';

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

		/** @type {import('echarts').MarkPointComponentOption['data'][number]} */
		const data = {
			name: state.label,
			coord: [state.x, state.y],
			value: state.label,
			symbol: state.symbol === 'arrow' ? 'path://M0,10 L5,0 L10,10 z' : state.symbol,
			symbolKeepAspect: true,
			symbolSize: state.symbolSize,
			itemStyle: {
				color: symbolColor
			}
		};

		/** @type {import('echarts').SeriesOption & { evidenceSeriesType: 'reference_point' }} */
		const series = {
			evidenceSeriesType: 'reference_point',
			id,
			type: 'line',
			markPoint: {
				data: [data],
				silent: true,
				label: {
					show: true,
					position: state.labelPosition,
					color: labelColor,
					backgroundColor: state.labelBackground
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
		set,
		update: (cb) => {
			const updatedStore = cb(get(store));
			set(updatedStore);
		}
	};
};
