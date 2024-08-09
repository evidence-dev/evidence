// @ts-check

import { get, writable } from 'svelte/store';
import { nanoid } from 'nanoid';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';
import { isPresetColor } from '../types.js';
import { COLORS } from './constants.js';
import { Query } from '@evidence-dev/sdk/usql';

/** @template T @typedef {import('svelte/store').Writable<T>} Writable */
/** @template T @typedef {import('svelte/store').Readable<T>} Readable */
/** @typedef {import('echarts').EChartsOption} EChartsOption */
/** @typedef {NonNullable<import('echarts').MarkPointComponentOption['data']>[number][]} MarkPointData */
/** @typedef {import('echarts').LineSeriesOption} LineSeriesOption */
/** @typedef {import('./types.js').ReferencePointStoreValue} ReferencePointStoreValue */
/** @typedef {import('./types.js').ReferencePointConfig} ReferencePointConfig */

/** @implements {Readable<ReferencePointStoreValue>} */
export class ReferencePointStore {
	/** @type {Writable<ReferencePointStoreValue>} */
	#store = writable({});

	#id = nanoid();

	/** @type {Readable<any>} */
	#propsStore;

	/** @type {Writable<EChartsOption>} */
	#configStore;

	/**
	 * @param {Readable<any>} propsStore
	 * @param {Writable<EChartsOption>} configStore
	 */
	constructor(propsStore, configStore) {
		this.#propsStore = propsStore;
		this.#configStore = configStore;
	}

	subscribe = this.#store.subscribe;

	/** @param {string | undefined} error */
	setError = (error) => this.#store.update((value) => ({ ...value, error }));

	clearError = () => this.setError(undefined);

	/** @param {ReferencePointConfig} config */
	setConfig = async (config) => {
		this.clearError();
		try {
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
			} = config;

			if (Query.isQuery(data) && !data.dataLoaded) {
				await data.fetch();
			}

			const props = get(this.#propsStore);
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

			/** @type {Partial<MarkPointData[number]>} */
			const seriesDataCommon = {
				symbol,
				symbolSize,
				symbolKeepAspect: true,
				itemStyle: {
					color: symbolColor,
					opacity: config.symbolOpacity,
					borderWidth: config.symbolBorderWidth,
					borderColor: config.symbolBorderColor
				}
			};

			/** @type {MarkPointData} */
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
						name: label ?? this.#id,
						value: label
					});
				}
			} else {
				throw new Error('You must provide x and y');
			}

			/** @type {import('echarts').LineSeriesOption & { evidenceSeriesType: 'reference_point' }} */
			const series = {
				evidenceSeriesType: 'reference_point',
				id: this.#id,
				type: 'line',
				animation: false,
				silent: true,
				markPoint: {
					data: seriesData,
					label: {
						width: config.labelWidth,
						padding: config.labelPadding,
						position: labelPosition,
						color: labelColor,
						opacity: 1,
						backgroundColor: config.labelBackgroundColor,
						borderColor: config.labelBorderColor,
						borderWidth: config.labelBorderWidth,
						borderRadius: config.labelBorderRadius,
						borderType: config.labelBorderType,
						overflow: 'break',
						fontSize: config.fontSize,
						align,
						fontWeight: config.bold ? 'bold' : undefined,
						fontStyle: config.italic ? 'italic' : undefined
					},
					emphasis: {
						disabled: true
					}
				}
			};

			this.#configStore.update((config) => {
				if (!config.series) config.series = [];
				if (!Array.isArray(config.series)) config.series = [config.series];

				const existingDataIndex = config.series.findIndex((series) => series.id === this.#id);
				if (existingDataIndex === -1) {
					config.series.push(series);
				} else {
					config.series[existingDataIndex] = series;
				}
				return config;
			});
		} catch (e) {
			this.setError(String(/** @type {any} */ (e).message));
		}
	};
}
