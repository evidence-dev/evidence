import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
import {
	formatValue,
	getFormatObjectFromString
} from '@evidence-dev/component-utilities/formatting';
import chroma from 'chroma-js';

/**
 * validateSize
 * @param {number} height
 * @param {number} width
 * @returns {{height: number, width: number}}
 */
export function validateSize(height, width) {
	if (height) {
		// if height was user-supplied
		height = Number(height);
		if (isNaN(height)) {
			// input must be a number
			throw Error('height must be a number');
		} else if (height <= 0) {
			throw Error('height must be a positive number');
		}
	} else {
		height = 15;
	}

	if (width) {
		// if width was user-supplied
		width = Number(width);
		if (isNaN(width)) {
			// input must be a number
			throw Error('width must be a number');
		} else if (width <= 0) {
			throw Error('width must be a positive number');
		}
	} else {
		width = 50;
	}

	return { height, width };
}

/**
 *
 * @param {import("@evidence-dev/sdk/usql).Query | unknown[]} data
 * @param {string} valueCol
 * @param {string} dateCol
 * @returns {value_format_object: object, date_format_object: object}
 */
export function getColumnFormats(data, valueCol, dateCol, valueFmt, dateFmt) {
	// Get column summary:
	const columnSummary = getColumnSummary(data);

	if (columnSummary[dateCol].type !== 'date') {
		throw Error('dateCol must be of type date');
	}

	// Get formats:
	const valueFormat = columnSummary[valueCol].format;
	const dateFormat = columnSummary[dateCol].format;

	// Set column formats
	const value_format_object = valueFmt ? getFormatObjectFromString(valueFmt) : valueFormat;
	const date_format_object = dateFmt ? getFormatObjectFromString(dateFmt) : dateFormat;

	return { value_format_object, date_format_object };
}

/**
 *
 * @param {*} sparklineData
 * @param {string} seriesType
 * @param {string} color
 * @param {import('@evidence-dev/tailwind').Theme} theme
 * @returns {import("echarts").EChartsOption}
 */
export function getSparklineConfig(
	sparklineData,
	type,
	seriesType,
	color,
	yScale,
	value_format_object,
	date_format_object,
	height,
	theme
) {
	return {
		title: {
			subtextStyle: {
				width: '100%'
			}
		},
		tooltip: {
			trigger: 'axis',
			position: function (point, params, dom, rect, size) {
				// Calculate horizontal center and a fixed vertical offset
				const horizontalCenter = size.viewSize[0] / 2 - size.contentSize[0] / 2;
				const verticalOffset = -11; // Adjust this value to position the tooltip above the chart
				return [horizontalCenter, verticalOffset];
			},
			formatter: function (params) {
				// Assuming params[0] is your primary data point
				const dataPoint = params[0];
				// Customize these HTML blocks as needed
				const valuePart = `<div style="text-align: center; background-color: ${theme.colors['base-100']}; border-radius: 1px; padding: 0px 2px;">${formatValue(
					dataPoint.value[1],
					value_format_object
				)}</div>`;
				const transparentGap = `<div style="background-color: transparent; height: ${
					height - 1.5
				}px;"></div>`; // Adjust height for the gap size
				const datePart = `<div style="text-align: center; height: 1em; background-color: transparent; border-radius: 1px; padding: 0px 2px;">${formatValue(
					dataPoint.axisValueLabel,
					date_format_object
				)}</div>`;

				return valuePart + transparentGap + datePart;
			},
			backgroundColor: 'transparent', // Semi-transparent white background
			borderWidth: 0,
			borderColor: 'transparent',
			extraCssText: 'box-shadow: none; padding-bottom: 0;', // Optional: Add some shadow for depth
			padding: 0,
			textStyle: {
				fontSize: 9
			}
		},
		legend: {
			show: false
		},
		grid: {
			left: 0,
			right: 0,
			bottom: 0,
			top: 0,
			containLabel: true
		},
		xAxis: {
			type: 'time',
			splitLine: {
				show: false
			},
			axisTick: {
				show: false
			},
			axisLine: {
				show: true,
				lineStyle: {
					color: theme.colors['base-300'],
					width: 0.75
				}
			},
			axisLabel: {
				show: false,
				hideOverlap: true,
				showMaxLabel: false,
				formatter: false,
				margin: 6
			},
			scale: true,
			z: 2,
			boundaryGap: '2%',
			axisPointer: {
				show: true,
				snap: true,
				type: 'line',
				z: 0,
				lineStyle: {
					width: 0.5
				},
				handle: {
					show: false
				},
				label: {
					show: false
				}
			}
		},
		yAxis: [
			{
				type: 'value',
				logBase: 10,
				splitLine: {
					show: false
				},
				axisLine: {
					show: false,
					onZero: false
				},
				axisTick: {
					show: false
				},
				axisLabel: {
					show: false,
					hideOverlap: true,
					margin: 4
				},
				name: '',
				nameLocation: 'end',
				nameTextStyle: {
					align: 'left',
					verticalAlign: 'top',
					padding: [0, 5, 0, 0]
				},
				nameGap: 6,
				scale: yScale,
				boundaryGap: ['1%', '1%'],
				z: 2
			}
		],
		series: [
			{
				type: seriesType,
				triggerLineEvent: true,
				label: {
					show: false,
					position: 'top',
					padding: 0,
					fontSize: 9
				},
				labelLayout: {
					hideOverlap: true
				},
				connectNulls: false,
				emphasis: {
					disabled: true
				},
				lineStyle: {
					width: 1,
					type: 'solid',
					color: color ?? theme.colors['base-content-muted']
				},
				areaStyle: {
					color:
						type === 'area'
							? color
								? chroma(color).brighten(1.5).hex()
								: theme.colors['base-300']
							: 'transparent'
				},
				itemStyle: {
					color: color ?? theme.colors['base-content-muted']
				},
				showSymbol: false,
				symbol: 'circle',
				symbolSize: 0,
				step: false,
				name: 'sparkline',
				data: sparklineData,
				yAxisIndex: 0
			}
		],
		animation: false
	};
}

const HALF_STROKE = 0.5; // half the 1px series line, so it is never clipped by the viewBox

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Geometry for a non-interactive sparkline, drawn as plain SVG instead of an
 * ECharts instance. A non-interactive sparkline has no tooltip, no axis labels
 * and no animation, so it does not need a chart engine — and creating one per
 * cell is prohibitively slow in WebKit (see _Sparkline.svelte).
 *
 * Mirrors the layout getSparklineConfig() asks ECharts for: xAxis
 * `boundaryGap: '2%'`, yAxis `boundaryGap: ['1%', '1%']`, `scale: yScale` (a
 * value axis with scale:false always includes zero), `connectNulls: false`, and
 * the x axis line resting on zero whenever zero is in range.
 *
 * @param {[unknown, unknown][]} sparklineData date/value pairs, sorted ascending by date
 * @param {'line' | 'area' | 'bar'} type
 * @param {number} width
 * @param {number} height
 * @param {boolean} yScale scale the y axis to the data instead of anchoring it to zero
 * @returns {{linePaths: string[], areaPaths: string[], bars: {x: number, y: number, w: number, h: number}[], baseline: number} | null} null when there is nothing renderable
 */
export function getSparklinePaths(sparklineData, type, width, height, yScale) {
	const dates = [];
	const values = [];
	for (const [date, value] of sparklineData) {
		dates.push(date instanceof Date ? date.getTime() : new Date(date).getTime());
		const n = value === null || value === undefined || value === '' ? NaN : Number(value);
		values.push(Number.isFinite(n) ? n : null);
	}

	const present = values.filter((v) => v !== null);
	if (!present.length || !dates.every((d) => Number.isFinite(d))) return null;

	const dateMin = Math.min(...dates);
	const dateMax = Math.max(...dates);
	const xPad = width * 0.02; // xAxis boundaryGap: '2%'
	const xOf = (d) =>
		dateMax === dateMin
			? width / 2
			: xPad + ((d - dateMin) / (dateMax - dateMin)) * (width - 2 * xPad);

	let valueMin = Math.min(...present);
	let valueMax = Math.max(...present);
	if (!yScale) {
		// an ECharts value axis with scale:false always includes zero
		valueMin = Math.min(0, valueMin);
		valueMax = Math.max(0, valueMax);
	}
	if (valueMin === valueMax) {
		// a flat series would divide by zero — centre it instead
		valueMin -= 1;
		valueMax += 1;
	}
	const yPad = (valueMax - valueMin) * 0.01; // yAxis boundaryGap: ['1%', '1%']
	valueMin -= yPad;
	valueMax += yPad;
	const yOf = (v) =>
		height - HALF_STROKE - ((v - valueMin) / (valueMax - valueMin)) * (height - 2 * HALF_STROKE);

	const baseline = valueMin <= 0 && valueMax >= 0 ? yOf(0) : height - HALF_STROKE;

	// connectNulls: false — every gap breaks the line into a new run
	const runs = [];
	let run = [];
	for (let i = 0; i < values.length; i++) {
		if (values[i] === null) {
			if (run.length) runs.push(run);
			run = [];
			continue;
		}
		run.push([round2(xOf(dates[i])), round2(yOf(values[i]))]);
	}
	if (run.length) runs.push(run);

	const linePaths =
		type === 'bar'
			? []
			: runs.map((r) =>
					r.length === 1
						? // a lone point draws nothing as a path — give it a 1px dash
							`M${round2(r[0][0] - 0.5)},${r[0][1]}L${round2(r[0][0] + 0.5)},${r[0][1]}`
						: `M${r.map(([x, y]) => `${x},${y}`).join('L')}`
				);

	const areaPaths =
		type === 'area'
			? runs
					.filter((r) => r.length > 1)
					.map(
						(r) =>
							`M${r.map(([x, y]) => `${x},${y}`).join('L')}` +
							`L${r[r.length - 1][0]},${round2(baseline)}L${r[0][0]},${round2(baseline)}Z`
					)
			: [];

	const bars = [];
	if (type === 'bar') {
		const barWidth = Math.max(1, ((width - 2 * xPad) / values.length) * 0.7);
		for (let i = 0; i < values.length; i++) {
			if (values[i] === null) continue;
			const y = yOf(values[i]);
			bars.push({
				x: round2(xOf(dates[i]) - barWidth / 2),
				y: round2(Math.min(y, baseline)),
				w: round2(barWidth),
				h: round2(Math.max(Math.abs(baseline - y), 0.5))
			});
		}
	}

	return { linePaths, areaPaths, bars, baseline: round2(baseline) };
}
