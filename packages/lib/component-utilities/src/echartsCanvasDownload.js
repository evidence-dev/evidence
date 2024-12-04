import { registerTheme, init } from 'echarts';
import { evidenceThemeLight, evidenceThemeDark } from './echartsThemes';
import download from 'downloadjs';

/** @typedef {{ theme: 'light' | 'dark'; backgroundColor: string }} EChartsCanvasDownloadActionOptions */

/** @param {HTMLElement} node */
/** @param {EChartsCanvasDownloadActionOptions} option */
const echartsCanvasDownloadAction = (node, option) => {
	registerTheme('light', evidenceThemeLight);
	registerTheme('dark', evidenceThemeDark);

	console.log('echartsCanvasDownloadAction', option.theme);
	const chart = init(node, option.theme, { renderer: 'canvas' });

	option.config.animation = false;

	chart.setOption(option.config);

	// Series Color override
	const applySeriesColors = () => {
		if (option.seriesColors) {
			/** @type {import("echarts").EChartsOption} */
			const prevOption = chart.getOption();
			if (!prevOption) return;
			const newOption = { ...prevOption };
			for (const seriesName of Object.keys(option.seriesColors)) {
				const matchingSeriesIndex = prevOption.series.findIndex((s) => s.name === seriesName);
				if (matchingSeriesIndex !== -1) {
					newOption.series[matchingSeriesIndex] = {
						...newOption.series[matchingSeriesIndex],
						itemStyle: {
							...newOption.series[matchingSeriesIndex].itemStyle,
							color: option.seriesColors[seriesName]
						}
					};
				}
			}
			chart.setOption(newOption);
		}
	};

	// Check if echartsOptions are provided and apply them
	const applyEchartsOptions = () => {
		if (option.echartsOptions) {
			chart.setOption({
				...option.echartsOptions
			});
		}
	};

	// seriesOptions - loop through series and apply same changes to each
	const applySeriesOptions = () => {
		let tempSeries = [];
		if (option.seriesOptions) {
			const reference_index = option.config.series.reduce(
				(acc, { evidenceSeriesType }, reference_index) => {
					if (
						evidenceSeriesType === 'reference_line' ||
						evidenceSeriesType === 'reference_area' ||
						evidenceSeriesType === 'reference_point'
					) {
						acc.push(reference_index);
					}
					return acc;
				},
				[]
			);

			for (let i = 0; i < option.config.series.length; i++) {
				if (reference_index.includes(i)) {
					tempSeries.push({});
				} else {
					tempSeries.push({ ...option.seriesOptions });
				}
			}
			chart.setOption({ series: tempSeries });
		}
	};

	applyEchartsOptions();
	applySeriesColors();
	applySeriesOptions();

	let src = chart.getConnectedDataURL({
		type: 'png',
		pixelRatio: 3,
		backgroundColor: option.backgroundColor,
		excludeComponents: ['toolbox']
	});

	const date = new Date();
	const localISOTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 19)
		.replaceAll(':', '-');

	download(
		src,
		(option.evidenceChartTitle ?? option.queryID ?? 'evidence-chart') + `_${localISOTime}.png`
	);

	chart.dispose();

	return {
		destroy() {
			chart.dispose();
		}
	};
};

export default echartsCanvasDownloadAction;
