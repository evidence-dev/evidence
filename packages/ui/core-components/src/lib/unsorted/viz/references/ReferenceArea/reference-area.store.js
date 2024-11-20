// @ts-check

import { nanoid } from 'nanoid';
import { get, writable } from 'svelte/store';
import checkInputs from '@evidence-dev/component-utilities/checkInputs';
import { Query } from '@evidence-dev/sdk/usql';
import chroma from 'chroma-js';

/** @template T @typedef {import('svelte/store').Writable<T>} Writable */
/** @template T @typedef {import('svelte/store').Readable<T>} Readable */
/** @typedef {import('echarts').EChartsOption} EChartsOption */
/** @typedef {NonNullable<import('echarts').MarkAreaComponentOption['data']>[number][]} MarkAreaData */
/** @typedef {import('echarts').SeriesOption} SeriesOption */
/** @typedef {import('echarts').BarSeriesOption} BarSeriesOption */
/** @typedef {import('echarts').LineSeriesOption} LineSeriesOption */
/** @typedef {import('./types.js').ReferenceAreaStoreValue} ReferenceAreaStoreValue */
/** @typedef {import('./types.js').ReferenceAreaConfig} ReferenceAreaConfig */

/** @implements {Readable<ReferenceAreaStoreValue>} */
export class ReferenceAreaStore {
	/** @type {Writable<ReferenceAreaStoreValue>} */
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

	/** @param {ReferenceAreaConfig} config */
	setConfig = async (config) => {
		this.clearError();
		try {
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
			} = config;

			if (Query.isQuery(data) && !data.dataLoaded) {
				await data.fetch();
			}

			// TODO maybe we could subscribe to props in here instead of the jank reactive statement in the component
			const props = get(this.#propsStore);
			if (typeof props === 'undefined') {
				throw new Error('Reference Area cannot be used outside of a chart');
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

			labelColor = labelColor ?? color;
			areaColor = areaColor ?? (color ? chroma(color).alpha(0.1).css() : undefined);
			borderColor = borderColor ?? color;

			/** @type {MarkAreaData} */
			const seriesData = [];

			if (data) {
				checkInputs(
					data,
					[xMin, xMax, yMin, yMax].filter((col) => typeof col !== 'undefined')
				);

				for (let i = 0; i < data.length; i++) {
					seriesData.push([
						{
							name: label ? (data[i][label] ?? label) : undefined,
							xAxis: xMin ? data[i][xMin] : undefined,
							yAxis: yMin ? data[i][yMin] : undefined
						},
						{
							xAxis: xMax ? data[i][xMax] : undefined,
							yAxis: yMax ? data[i][yMax] : undefined
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
			/** @type {BarSeriesOption | undefined} */
			let barSeries;
			const allSeries = get(this.#configStore).series;
			if (Array.isArray(allSeries)) {
				barSeries = allSeries.find(isBarSeries);
			} else if (allSeries) {
				barSeries = isBarSeries(allSeries) ? allSeries : undefined;
			}

			/** @type {(LineSeriesOption | BarSeriesOption) & {evidenceSeriesType: 'reference_area' }} */
			const series = {
				evidenceSeriesType: 'reference_area',
				id: this.#id,
				type: get(this.#propsStore).chartType === 'Bar Chart' ? 'bar' : 'line',
				stack: barSeries?.stack,
				animation: false,
				silent: true,
				markArea: {
					data: seriesData,
					emphasis: {
						disabled: true
					},
					itemStyle: {
						color: areaColor,
						opacity: config.opacity,
						borderWidth,
						borderColor,
						borderType: config.borderType
					},
					label: {
						show: true,
						position: LABEL_POSITIONS[labelPosition],
						color: labelColor,
						padding: config.labelPadding,
						backgroundColor: config.labelBackgroundColor,
						borderColor: config.labelBorderColor,
						borderWidth: config.labelBorderWidth,
						borderRadius: config.labelBorderRadius,
						borderType: config.labelBorderType,
						fontSize: config.fontSize,
						align: config.align,
						fontWeight: config.bold ? 'bold' : undefined,
						fontStyle: config.italic ? 'italic' : undefined
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

				// Make sure area aligns with categorical axis on bar charts correctly
				if (props.swapXY) {
					if (Array.isArray(config.yAxis)) {
						config.yAxis.forEach((yAxis) => {
							if (yAxis.type === 'category') {
								yAxis.axisTick = {
									...yAxis.axisTick,
									alignWithLabel: false
								};
							}
						});
					} else if (config.yAxis) {
						config.yAxis.axisTick = {
							...config.yAxis.axisTick,
							alignWithLabel: false
						};
					}
				} else {
					if (Array.isArray(config.xAxis)) {
						config.xAxis.forEach((xAxis) => {
							if (xAxis.type === 'category') {
								xAxis.axisTick = {
									...xAxis.axisTick,
									alignWithLabel: false
								};
							}
						});
					} else if (config.xAxis) {
						config.xAxis.axisTick = {
							...config.xAxis.axisTick,
							alignWithLabel: false
						};
					}
				}

				return config;
			});
		} catch (e) {
			this.setError(String(/** @type {any} */ (e).message));
		}
	};
}

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

/**
 * @param {SeriesOption} series
 * @returns {series is BarSeriesOption}
 */
const isBarSeries = (series) => series.type === 'bar' && !('evidenceSeriesType' in series);
