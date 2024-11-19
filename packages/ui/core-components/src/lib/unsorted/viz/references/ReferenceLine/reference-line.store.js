// @ts-check

import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';
import { formatValue } from '@evidence-dev/component-utilities/formatting';
import { LABEL_POSITIONS } from './constants.js';
import { Query } from '@evidence-dev/sdk/usql';

/** @template T @typedef {import('svelte/store').Writable<T>} Writable */
/** @template T @typedef {import('svelte/store').Readable<T>} Readable */
/** @typedef {import('echarts').EChartsOption} EChartsOption */
/** @typedef {NonNullable<import('echarts').MarkLineComponentOption['data']>[number][]} MarkLineData */
/** @typedef {import('echarts').LineSeriesOption} LineSeriesOption */
/** @typedef {import('./types.js').ReferenceLineStoreValue} ReferenceLineStoreValue */
/** @typedef {import('./types.js').ReferenceLineConfig} ReferenceLineConfig */

/** @implements {Readable<ReferenceLineStoreValue>} */
export class ReferenceLineStore {
	/** @type {Writable<ReferenceLineStoreValue>} */
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

	/** @param {ReferenceLineConfig} config */
	setConfig = async (config) => {
		this.clearError();
		try {
			let { data, x, y, x2, y2, color, labelColor, lineColor, label, hideValue } = config;

			if (Query.isQuery(data) && !data.dataLoaded) {
				await data.fetch();
			}

			// TODO maybe we could subscribe to this in here instead of the jank reactive statement in the component
			const props = get(this.#propsStore);
			if (typeof props === 'undefined') {
				throw new Error('Reference Line cannot be used outside of a chart');
			}
			let { xFormat, yFormat, swapXY } = props;

			if (swapXY) {
				[x, y] = [y, x];
				[x2, y2] = [y2, x2];
				[xFormat, yFormat] = [yFormat, xFormat];
			}

			const symbolStartConfig = {
				symbol: config.symbolStart,
				symbolSize: config.symbolStartSize,
				symbolKeepAspect: true
			};

			const symbolEndConfig = {
				symbol: config.symbolEnd,
				symbolSize: config.symbolEndSize,
				symbolKeepAspect: true
			};

			[symbolStartConfig, symbolEndConfig].forEach((symbolConfig) => {
				if (symbolConfig.symbol === 'arrow') {
					// Use a nicer arrow symbol
					symbolConfig.symbol = 'path://M0,10 L5,0 L10,10 z';
				} else if (symbolConfig.symbol === 'none') {
					// using symbol=none removes the label, which we dont want
					// so we set symbolSize=0 instead
					symbolConfig.symbol = undefined;
					symbolConfig.symbolSize = 0;
				}
			});

			// Use preset colors
			labelColor = labelColor ?? color;
			lineColor = lineColor ?? color;

			const labelPosition = config.labelPosition
				? LABEL_POSITIONS[config.labelPosition]
				: 'insideEndTop';

			/** @type {MarkLineData} */
			const seriesData = [];

			if (typeof data !== 'undefined' && data[Symbol.iterator]) {
				checkInputs(
					data,
					[x, y, x2, y2].filter((col) => typeof col !== 'undefined')
				);
			}

			if (typeof x !== 'undefined' && typeof y !== 'undefined') {
				if (typeof x2 === 'undefined' && typeof y2 === 'undefined') {
					throw new Error('Either x2 or y2 must be provided when x and y are provided');
				}

				if (typeof data !== 'undefined' && data[Symbol.iterator]) {
					for (let i = 0; i < data.length; i++) {
						const _x1 = data[i][x];
						const _y1 = data[i][y];
						const _x2 = data[i][x2 || x];
						const _y2 = data[i][y2 || y];
						const name = label ? (data[i][label] ?? label) : undefined;
						seriesData.push([
							{ coord: [_x1, _y1], name, ...symbolStartConfig },
							{ coord: [_x2, _y2] }
						]);
					}
				} else {
					const _x2 = x2 || x;
					const _y2 = y2 || y;
					const name = label;
					seriesData.push([{ coord: [x, y], name, ...symbolStartConfig }, { coord: [_x2, _y2] }]);
				}
			} else if (typeof x !== 'undefined') {
				if (typeof data !== 'undefined' && data[Symbol.iterator]) {
					for (let i = 0; i < data.length; i++) {
						const _x = data[i][x];
						const name = label ? (data[i][label] ?? label) : undefined;
						seriesData.push({ xAxis: _x, name, ...symbolStartConfig });
					}
				} else {
					const name = label;
					seriesData.push({ xAxis: x, name, ...symbolStartConfig });
				}
			} else if (typeof y !== 'undefined') {
				if (typeof data !== 'undefined' && data[Symbol.iterator]) {
					for (let i = 0; i < data.length; i++) {
						const _y = data[i][y];
						const name = label ? (data[i][label] ?? label) : undefined;
						seriesData.push({ yAxis: _y, name, ...symbolStartConfig });
					}
				} else {
					const name = label;
					seriesData.push({ yAxis: y, name, ...symbolStartConfig });
				}
			} else {
				throw new Error('Either x or y must be provided when data is provided');
			}

			/** @satisfies {LineSeriesOption & {evidenceSeriesType: 'reference_line' }} */
			const series = {
				evidenceSeriesType: 'reference_line',
				id: this.#id,
				type: 'line',
				animation: false,
				silent: true,
				markLine: {
					data: seriesData,
					animation: false,
					...symbolEndConfig,
					emphasis: {
						disabled: true
					},
					label: {
						show: true,
						position: labelPosition,
						color: labelColor,
						backgroundColor: config.labelBackgroundColor,
						borderColor: config.labelBorderColor,
						borderWidth: config.labelBorderWidth,
						borderRadius: config.labelBorderRadius,
						borderType: config.labelBorderType,
						padding: config.labelPadding,
						fontSize: config.fontSize,
						align: config.align,
						fontWeight: config.bold ? 'bold' : undefined,
						fontStyle: config.italic ? 'italic' : undefined,
						formatter: (params) => {
							const label = params.name;
							let result = '';

							const { xAxis, yAxis } = /** @type {Record<string, string | undefined>} */ (
								params.data
							);

							const hasY = typeof y !== 'undefined';
							const hasX = typeof x !== 'undefined';
							const isSloped = hasY && hasX;

							const value = formatValue(
								hasY ? yAxis : hasX ? xAxis : params.value,
								hasY ? yFormat : hasX ? xFormat : 'string'
							);

							if (label) {
								result += label;
								if (!hideValue && !isSloped) {
									result += ` (${value})`;
								}
							} else if (!hideValue) {
								result += value;
							}

							return result;
						}
					},
					lineStyle: {
						color: lineColor,
						width: config.lineWidth,
						type: config.lineType
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
