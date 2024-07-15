// @ts-check

import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';
import { formatValue } from '@evidence-dev/component-utilities/formatting';
import { isPresetColor } from '../types.js';
import { COLORS, LABEL_POSITIONS } from './constants.js';

/**
 * @typedef {import('svelte/store').Readable<import('./reference-line.js').ReferenceLineStoreValue>} IReferenceLineStore
 * @implements {IReferenceLineStore}
 */
export class ReferenceLineStore {
	/** @type {import('svelte/store').Writable<import('./reference-line.js').ReferenceLineStoreValue>} */
	#store = writable({});

	#id = nanoid();

	/** @type {import('svelte/store').Writable<any>} */
	#propsStore;

	/** @type {import('svelte/store').Writable<any>} */
	#configStore;

	/**
	 * @param {import('svelte/store').Writable<any>} propsStore
	 * @param {import('svelte/store').Writable<any>} configStore
	 */
	constructor(propsStore, configStore) {
		this.#propsStore = propsStore;
		this.#configStore = configStore;
	}

	subscribe = this.#store.subscribe;

	/** @param {string | undefined} error */
	setError = (error) => this.#store.update((value) => ({ ...value, error }));

	clearError = () => this.setError(undefined);

	/** @param {import('./reference-line.js').ReferenceLineConfig} value */
	setConfig = (value) => {
		this.clearError();
		try {
			let { data, x, y, x2, y2, color, labelColor, lineColor, label, hideValue } = value;

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

			// Use preset colors
			labelColor = labelColor ?? color;
			lineColor = lineColor ?? color;
			if (isPresetColor(labelColor)) {
				labelColor = COLORS[labelColor].labelColor;
			}
			if (isPresetColor(lineColor)) {
				lineColor = COLORS[lineColor].lineColor;
			}

			const labelPosition = value.labelPosition
				? LABEL_POSITIONS[value.labelPosition]
				: 'insideEndTop';

			/** @type {NonNullable<import('echarts').MarkLineComponentOption['data']>[number][]} */
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
						seriesData.push([{ coord: [_x1, _y1], name }, { coord: [_x2, _y2] }]);
					}
				} else {
					const _x2 = x2 || x;
					const _y2 = y2 || y;
					const name = label;
					seriesData.push([{ coord: [x, y], name }, { coord: [_x2, _y2] }]);
				}
			} else if (typeof x !== 'undefined') {
				if (typeof data !== 'undefined' && data[Symbol.iterator]) {
					for (let i = 0; i < data.length; i++) {
						const _x = data[i][x];
						const name = label ? (data[i][label] ?? label) : undefined;
						seriesData.push({ xAxis: _x, name });
					}
				} else {
					const name = label;
					seriesData.push({ xAxis: x, name });
				}
			} else if (typeof y !== 'undefined') {
				if (typeof data !== 'undefined' && data[Symbol.iterator]) {
					for (let i = 0; i < data.length; i++) {
						const _y = data[i][y];
						const name = label ? (data[i][label] ?? label) : undefined;
						seriesData.push({ yAxis: _y, name });
					}
				} else {
					const name = label;
					seriesData.push({ yAxis: y, name });
				}
			} else {
				throw new Error('Either x or y must be provided when data is provided');
			}

			/** @type {import('echarts').LineSeriesOption & {evidenceSeriesType: 'reference_line' }} */
			const series = {
				evidenceSeriesType: 'reference_line',
				id: this.#id,
				type: 'line',
				animation: false,
				silent: true,
				markLine: {
					data: seriesData,
					animation: false,
					symbol: 'none',
					emphasis: {
						disabled: true
					},
					label: {
						show: true,
						position: labelPosition,
						color: labelColor,
						backgroundColor: value.labelBackgroundColor,
						padding: value.labelPadding,
						borderRadius: value.labelBorderRadius,
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
						width: value.lineWidth,
						type: value.lineType
					}
				}
			};

			this.#configStore.update((config) => {
				const existingDataIndex = config.series.findIndex(
					(/** @type {{ id?: string; }} */ series) => series.id === this.#id
				);
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
