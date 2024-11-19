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
	tooltipBackgroundColor,
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
				const valuePart = `<div style="text-align: center; background-color: ${tooltipBackgroundColor}; border-radius: 1px; padding: 0px 2px; height: 12px;">${formatValue(
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
