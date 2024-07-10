// @ts-check

import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import { COLORS } from './constants.js';
import { isPresetColor } from '../types.js';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';

/**
 * @param {import('svelte/store').Writable<any>} propsStore
 * @param {import('svelte/store').Writable<any>} configStore
 * @returns {import('./reference-area.js').ReferenceAreaStore}
 */
export const createReferenceAreaStore = (propsStore, configStore) => {
	/** @type {import('./reference-area.d.ts').ReferenceAreaStore} */
	const store = writable({});

	/** @param {string | undefined} error */
	const setError = (error) => store.update((value) => ({ ...value, error }));
	const clearError = () => setError(undefined);

	const id = nanoid();

	/** @param {import('./reference-area.d.ts').ReferenceAreaStoreValue} value */
	const set = (value) => {
		let {
			data,
			xMin,
			xMax,
			yMin,
			yMax,
			color,
			areaColor,
			labelColor,
			label,
			labelPosition,
			border,
			borderWidth,
			borderColor
		} = value;

		// TODO maybe we could subscribe to props in here instead of the jank reactive statement in the component
		const props = get(propsStore);
		if (typeof props === 'undefined') {
			throw new Error('Reference Line cannot be used outside of a chart');
		}

		if (props.swapXY) {
			[xMin, xMax, yMin, yMax] = [yMin, yMax, xMin, xMax];
		}

		// Default label position based on props
		if (typeof labelPosition === 'undefined') {
			if (props.swapXY) labelPosition = 'topRight';
			else if (yMin && yMax && xMin && xMax) labelPosition = 'topLeft';
			else if (yMin || yMax) labelPosition = 'right';
			else labelPosition = 'top';
		}

		if (border && typeof borderWidth === 'undefined') {
			borderWidth = 1;
		}

		// Use preset colors
		labelColor = labelColor ?? color;
		areaColor = areaColor ?? color;
		borderColor = borderColor ?? color;
		if (isPresetColor(labelColor)) {
			labelColor = COLORS[labelColor].labelColor;
		}
		if (isPresetColor(areaColor)) {
			areaColor = COLORS[areaColor].areaColor;
		}
		if (isPresetColor(borderColor)) {
			borderColor = COLORS[borderColor].borderColor;
		}

		if (typeof data !== 'undefined') {
			checkInputs(
				data,
				[xMin, xMax, yMin, yMax].filter((col) => typeof col !== 'undefined')
			);
		}

		/** @type {NonNullable<import('echarts').MarkAreaComponentOption['data']>[number][]} */
		const seriesData = [];

		if (data) {
			for (let i = 0; i < data.length; i++) {
				seriesData.push([
					{
						name: data[i][label] ?? label,
						xAxis: data[i][xMin],
						yAxis: data[i][yMin]
					},
					{
						xAxis: data[i][xMax],
						yAxis: data[i][yMax]
					}
				]);
			}
		} else {
			seriesData.push([
				{
					name: label,
					xAxis: xMin,
					yAxis: yMin
				},
				{
					xAxis: xMax,
					yAxis: yMax
				}
			]);
		}

		// Find the series for the bar chart data (if it exists) so we can use the appropriate stack
		const barStack = get(configStore).series.find(
			(s) => s.type === 'bar' && !s.evidenceSeriesType
		)?.stack;

		/** @type {(import('echarts').LineSeriesOption | import('echarts').BarSeriesOption) & {evidenceSeriesType: 'reference_area' }} */
		const series = {
			evidenceSeriesType: 'reference_area',
			id,
			type: get(propsStore).chartType === 'Bar Chart' ? 'bar' : 'line',
			stack: barStack,
			animation: false,
			silent: true,
			markArea: {
				data: seriesData,
				emphasis: {
					disabled: true
				},
				itemStyle: {
					color: areaColor,
					opacity: 1,
					borderWidth,
					borderColor,
					borderType: value.borderType
				},
				label: {
					show: true,
					position: LABEL_POSITIONS[labelPosition],
					color: labelColor
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

			// Make sure area aligns with categorical axis on bar charts correctly
			if (props.swapXY) {
				config.yAxis = {
					...config.yAxis,
					axisTick: {
						alignWithLabel: false
					}
				};
			} else {
				config.xAxis = {
					...config.xAxis,
					axisTick: {
						alignWithLabel: false
					}
				};
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

export const LABEL_POSITIONS = /** @type {const} */ ({
	topLeft: 'insideTopLeft',
	top: 'insideTop',
	topRight: 'insideTopRight',
	bottomLeft: 'insideBottomLeft',
	bottom: 'insideBottom',
	bottomRight: 'insideBottomRight',
	left: 'insideLeft',
	center: 'inside',
	centre: 'inside',
	right: 'insideRight'
});
