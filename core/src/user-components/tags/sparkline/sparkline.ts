import { logger } from '../../../shims/logger';
import type { EChartsOption } from 'echarts';

// Range type definition
export interface Range {
	min?: number | null;
	max?: number | null;
}

/**
 * validateSize - Validates and normalizes width and height values
 */
export function validateSize(
	height: number | string | undefined,
	width: number | string | undefined
): { height: number; width: number } {
	let validatedHeight: number;
	let validatedWidth: number;

	if (height !== undefined) {
		// If height was user-supplied
		validatedHeight = Number(height);
		if (Number.isNaN(validatedHeight)) {
			// Input must be a number
			throw Error('height must be a number');
		}
		if (validatedHeight <= 0) {
			throw Error('height must be a positive number');
		}
	} else {
		validatedHeight = 15;
	}

	if (width !== undefined) {
		// If width was user-supplied
		validatedWidth = Number(width);
		if (Number.isNaN(validatedWidth)) {
			// Input must be a number
			throw Error('width must be a number');
		}
		if (validatedWidth <= 0) {
			throw Error('width must be a positive number');
		}
	} else {
		validatedWidth = 50;
	}

	return { height: validatedHeight, width: validatedWidth };
}

/**
 * getSparklineVizConfig - Generates ECharts configuration for a sparkline chart
 *
 * `themeColors` should carry resolved shadcn tokens (foreground for the hover
 * value + date, mutedForeground for the vertical tracking line). Optional so
 * direct callers still work; SparklineDisplay always passes them from
 * ThemeContext so per-project themes propagate. Without them the tooltip text
 * and tracking line fall through to ECharts' internal defaults, which read as
 * near-white on light backgrounds.
 */
export function getSparklineVizConfig(
	sparklineData: Array<[string | Date, number]>,
	type: 'line' | 'area' | 'bar',
	color: string | undefined,
	yScale: boolean,
	height: number,
	mode: 'light' | 'dark',
	themeColors?: { foreground?: string; mutedForeground?: string }
): EChartsOption {
	// Define base colors based on theme mode
	const baseContentMuted = mode === 'dark' ? '#9ca3af' : '#6b7280'; // gray-400/500
	const base300 = mode === 'dark' ? '#334155' : '#e2e8f0'; // slate-700/slate-200
	const baseContent = mode === 'dark' ? '#f8fafc' : '#0f172a'; // slate-50/slate-900

	// Sparkline draws its own tooltip HTML with backgroundColor:transparent, so
	// the text + tracking line need explicit colors — the ECharts theme's tooltip
	// defaults don't survive the transparent-container override reliably.
	const tooltipTextColor = themeColors?.foreground ?? baseContent;
	const axisPointerColor = themeColors?.mutedForeground ?? baseContentMuted;

	// Use a default color based on theme if not provided
	const defaultColor = color || baseContentMuted;

	// Configure the chart
	const config: EChartsOption = {
		title: {
			subtextStyle: {
				width: 100
			}
		},
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'axis',
			position: (point, params, dom, rect, size) => {
				// Calculate horizontal center and a fixed vertical offset
				const horizontalCenter = size.viewSize[0] / 2 - size.contentSize[0] / 2;
				const verticalOffset = -11; // Position tooltip above the chart
				return [horizontalCenter, verticalOffset];
			},
			formatter: (params) => {
				// Ensure params is an array and not empty
				const paramArray = Array.isArray(params) ? params : [params];
				if (paramArray.length === 0) return '';

				// Get first data point and safely access properties
				const dataPoint = paramArray[0];
				if (!dataPoint) return '';

				// Try to safely get values with a fallback
				let yValue = '';
				let xValue = '';

				try {
					// Access value and try to get second element if it's an array
					const value = dataPoint.value;
					if (Array.isArray(value) && value.length > 1) {
						yValue = String(value[1]);
					}

					// Try to get a display value for the x-axis using property check
					if ('axisValue' in dataPoint) {
						xValue = String(dataPoint.axisValue);
					} else if (value && Array.isArray(value) && value.length > 0) {
						xValue = String(value[0]);
					} else if (dataPoint.name) {
						xValue = String(dataPoint.name);
					}
				} catch (e) {
					// Fallback for any errors
					logger.error(e, 'Error formatting tooltip');
				}

				// Format the HTML blocks for tooltip
				// Use a transparent background instead of trying to match app color
				const valuePart = `<div style="text-align: center; border-radius: 1px; padding: 0px 2px; text-shadow: 0 0 1px rgba(0,0,0,0.05);">${yValue}</div>`;
				const transparentGap = `<div style="background-color: transparent; height: ${height - 1.5}px;"></div>`;
				const datePart = `<div style="text-align: center; height: 1em; background-color: transparent; border-radius: 1px; padding: 0px 2px; text-shadow: 0 0 1px rgba(0,0,0,0.05);">${xValue}</div>`;

				return valuePart + transparentGap + datePart;
			},
			backgroundColor: 'transparent',
			borderWidth: 0,
			borderColor: 'transparent',
			extraCssText: 'box-shadow: none; padding-bottom: 0;',
			padding: 0,
			textStyle: {
				fontSize: 9,
				color: tooltipTextColor
			}
		},
		legend: {
			show: false
		},
		grid: {
			left: 0,
			right: 0,
			bottom: 0,
			top: 0
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
					color: base300,
					width: 0.75
				}
			},
			axisLabel: {
				show: false,
				hideOverlap: true,
				showMaxLabel: false,
				margin: 6
			},
			// For the boundaryGap property, use a string array with percentages for ECharts
			boundaryGap: type === 'bar' ? ['2%', '2%'] : ['0%', '0%'],
			axisPointer: {
				show: true,
				snap: true,
				type: 'line',
				lineStyle: {
					width: 0.5,
					color: axisPointerColor
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
				type: type === 'area' ? 'line' : type,
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
					color: defaultColor
				},
				areaStyle:
					type === 'area'
						? {
								opacity: mode === 'dark' ? 0.3 : 0.2 // Simple opacity for the area
							}
						: undefined,
				itemStyle: {
					color: defaultColor
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

	return config;
}
