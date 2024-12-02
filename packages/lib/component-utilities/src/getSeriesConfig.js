import getDistinctValues from './getDistinctValues.js';
import { fmt } from '@evidence-dev/component-utilities/formatting';

export default function getSeriesConfig(
	data,
	x,
	y,
	series,
	swapXY,
	baseConfig,
	name,
	xMismatch, // this checks for scenarios where xType is string and xDataType is number. When this is the case, we need to inject strings into the x axis, or else it will cause echarts to think there are duplicate x-axis values (e.g., "4" and 4)
	columnSummary,
	seriesOrder,
	size = undefined,
	tooltipTitle = undefined,
	y2 = undefined,
	seriesLabelFmt = undefined
) {
	function generateTempConfig(seriesData, seriesName, yAxisIndex, baseConfig) {
		let tempConfig = {
			name: seriesName,
			data: seriesData,
			yAxisIndex: yAxisIndex
		};
		tempConfig = { ...baseConfig, ...tempConfig };
		return tempConfig;
	}

	let i;
	let j;
	let tempConfig;
	let seriesConfig = [];
	let seriesData;
	let filteredData;
	let seriesName;
	let seriesDistinct;
	let yAxisIndex;

	// y = single, y2 = empty
	// y = single, y2 = single
	// y = single, y2 = array

	// y = array, y2 = empty
	// y = array, y2 = single
	// y = array, y2 = array

	// y = empty, y2 = empty
	// y = empty, y2 = single
	// y = empty, y2 = array

	// colname, yAxisIndex

	function combineVariables(variable1, variable2) {
		// Returns an array of arrays, where each individual array is [column_name, yAxisIndex], where yAxisIndex is 0 for y and 1 for y2.
		// E.g., [ ['sales', 0 ], ['gross_profit', 1]] - sales on primary axis, gross profit on secondary
		const array = [];

		// Helper function to check if a value is undefined
		function isUndefined(value) {
			return typeof value === 'undefined';
		}

		// Helper function to add non-undefined values to the array with source indicator
		function addValuesToArray(value, source) {
			if (!isUndefined(value)) {
				if (Array.isArray(value)) {
					value.forEach((item) => array.push([item, source]));
				} else {
					array.push([value, source]);
				}
			}
		}

		addValuesToArray(variable1, 0);
		addValuesToArray(variable2, 1);

		return array;
	}

	let yList = combineVariables(y, y2);

	// 1) Series column with single y column
	if (series != null && yList.length === 1) {
		seriesDistinct = getDistinctValues(data, series);

		for (i = 0; i < seriesDistinct.length; i++) {
			// Filter for specific series:
			filteredData = data.filter((d) => d[series] === seriesDistinct[i]);

			if (swapXY) {
				seriesData = filteredData.map((d) => [d[yList[0][0]], xMismatch ? d[x].toString() : d[x]]);
			} else {
				seriesData = filteredData.map((d) => [xMismatch ? d[x].toString() : d[x], d[yList[0][0]]]);
			}

			// Append size column if supplied (for bubble chart):
			if (size) {
				let sizeData = filteredData.map((d) => d[size]);
				seriesData.forEach((item, index) => item.push(sizeData[index]));
			}

			// Append tooltip label if supplied:
			if (tooltipTitle) {
				let tooltipData = filteredData.map((d) => d[tooltipTitle]);
				seriesData.forEach((item, index) => item.push(tooltipData[index]));
			}

			// Set series name:
			seriesName = seriesDistinct[i] ?? 'null';

			// Set y-axis index (used for multi-y axis charts):
			yAxisIndex = yList[0][1];

			tempConfig = generateTempConfig(seriesData, seriesName, yAxisIndex, baseConfig);
			seriesConfig.push(tempConfig);
		}
	}

	// 2) Series column with multiple y columns
	if (series != null && yList.length > 1) {
		seriesDistinct = getDistinctValues(data, series);
		for (i = 0; i < seriesDistinct.length; i++) {
			// Filter for specific series:
			filteredData = data.filter((d) => d[series] === seriesDistinct[i]);

			for (j = 0; j < yList.length; j++) {
				if (swapXY) {
					seriesData = filteredData.map((d) => [
						d[yList[j][0]],
						xMismatch ? d[x].toString() : d[x]
					]);
				} else {
					seriesData = filteredData.map((d) => [
						xMismatch ? d[x].toString() : d[x],
						d[yList[j][0]]
					]);
				}

				// Append size column if supplied (for bubble chart):
				if (size) {
					let sizeData = filteredData.map((d) => d[size]);
					seriesData.forEach((item, index) => item.push(sizeData[index]));
				}

				// Append tooltip label if supplied:
				if (tooltipTitle) {
					let tooltipData = filteredData.map((d) => d[tooltipTitle]);
					seriesData.forEach((item, index) => item.push(tooltipData[index]));
				}

				// Set series name:
				seriesName = (seriesDistinct[i] ?? 'null') + ' - ' + columnSummary[yList[j][0]].title;

				// Set y-axis index (used for multi-y axis charts):
				yAxisIndex = yList[j][1];

				tempConfig = generateTempConfig(seriesData, seriesName, yAxisIndex, baseConfig);
				seriesConfig.push(tempConfig);
			}
		}
	}

	// 3) Multiple y columns without series column
	if (series == null && yList.length > 1) {
		for (i = 0; i < yList.length; i++) {
			if (swapXY) {
				seriesData = data.map((d) => [d[yList[i][0]], xMismatch ? d[x].toString() : d[x]]);
			} else {
				seriesData = data.map((d) => [xMismatch ? d[x].toString() : d[x], d[yList[i][0]]]);
			}

			// Append size column if supplied (for bubble chart):
			if (size) {
				let sizeData = data.map((d) => d[size]);
				seriesData.forEach((item, index) => item.push(sizeData[index]));
			}

			// Append tooltip label if supplied:
			if (tooltipTitle) {
				let tooltipData = data.map((d) => d[tooltipTitle]);
				seriesData.forEach((item, index) => item.push(tooltipData[index]));
			}

			seriesName = columnSummary[yList[i][0]].title;

			// Set y-axis index (used for multi-y axis charts):
			yAxisIndex = yList[i][1];

			tempConfig = generateTempConfig(seriesData, seriesName, yAxisIndex, baseConfig);
			seriesConfig.push(tempConfig);
		}
	}

	// 4) Single y column without series column
	if (series == null && yList.length === 1) {
		if (swapXY) {
			seriesData = data.map((d) => [d[yList[0][0]], xMismatch ? d[x].toString() : d[x]]);
		} else {
			seriesData = data.map((d) => [xMismatch ? d[x].toString() : d[x], d[yList[0][0]]]);
		}

		// Append size column if supplied (for bubble chart):
		if (size) {
			let sizeData = data.map((d) => d[size]);
			seriesData.forEach((item, index) => item.push(sizeData[index]));
		}

		// Append tooltip label if supplied:
		if (tooltipTitle) {
			let tooltipData = data.map((d) => d[tooltipTitle]);
			seriesData.forEach((item, index) => item.push(tooltipData[index]));
		}

		seriesName = columnSummary[yList[0][0]].title;

		// Set y-axis index (used for multi-y axis charts):
		yAxisIndex = yList[0][1];

		tempConfig = generateTempConfig(seriesData, seriesName, yAxisIndex, baseConfig);
		seriesConfig.push(tempConfig);
	}

	if (seriesOrder) {
		seriesConfig.sort((a, b) => seriesOrder.indexOf(a.name) - seriesOrder.indexOf(b.name));
	}

	// format series config:
	if (seriesLabelFmt) {
		seriesConfig.forEach((item) => {
			item.name = fmt(item.name, seriesLabelFmt);
		});
	}

	return seriesConfig;
}
