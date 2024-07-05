// @ts-check

import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';
import { formatValue } from '@evidence-dev/component-utilities/formatting';
import { isPresetColor } from '../types.js';
import { COLORS, LABEL_POSITIONS } from './constants.js';

/**
 * @param {import('svelte/store').Writable<any>} propsStore
 * @param {import('svelte/store').Writable<any>} configStore
 * @returns {import('./reference-line.js').ReferenceLineStore}
 */
export const createReferenceLineStore = (propsStore, configStore) => {
	/** @type {import('./reference-line.d.ts').ReferenceLineStore} */
	const store = writable({});

	/** @param {string | undefined} error */
	const setError = (error) => store.update((value) => ({ ...value, error }));
	const clearError = () => setError(undefined);

	const id = nanoid();

	/** @param {import('./reference-line.d.ts').ReferenceLineStoreValue} value */
	const set = (value) => {
		let { data, x, y, x2, y2, color, labelColor, lineColor, label, hideValue, symbol, symbolSize } =
			value;

		// TODO maybe we could subscribe to this in here instead of the jank reactive statement in the component
		const props = get(propsStore);
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

		if (symbol === 'arrow') {
			// Use a nicer arrow symbol
			symbol = 'path://M0,10 L5,0 L10,10 z';
		} else if (symbol === 'none') {
			// using symbol=none removes the label, which we dont want
			// so we set symbolSize=0 instead
			symbol = undefined;
			symbolSize = 0;
		}

		const symbolOpts = {
			symbol,
			symbolSize,
			symbolKeepAspect: true
		};

		/** @type {NonNullable<import('echarts').MarkLineComponentOption['data']>[number][]} */
		const seriesData = [];

		if (typeof data !== 'undefined' && !data[Symbol.iterator]) {
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
					const name = label ? data[i][label] ?? label : undefined;
					seriesData.push([
						{ coord: [_x1, _y1], name },
						{ coord: [_x2, _y2], ...symbolOpts }
					]);
				}
			} else {
				const _x2 = x2 || x;
				const _y2 = y2 || y;
				const name = label;
				seriesData.push([
					{ coord: [x, y], name },
					{ coord: [_x2, _y2], ...symbolOpts }
				]);
			}
		} else if (typeof x !== 'undefined') {
			if (typeof data !== 'undefined' && data[Symbol.iterator]) {
				for (let i = 0; i < data.length; i++) {
					const _x = data[i][x];
					const name = label ? data[i][label] ?? label : undefined;
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
					const name = label ? data[i][label] ?? label : undefined;
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
			id,
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
		set: (value) => {
			clearError();
			try {
				set(value);
			} catch (e) {
				setError(String(/** @type {any} */ (e).message));
			}
		},
		update: (cb) => {
			clearError();
			let value = get(store);
			try {
				value = cb(value);
				value.error = undefined;
				set(value);
			} catch (e) {
				setError(String(/** @type {any} */ (e).message));
			}
		}
	};
};
