import { registerTheme, init } from 'echarts';
import { evidenceThemeLight } from './echartsThemes';

export default (node, option) => {
	registerTheme('evidence-light', evidenceThemeLight);

	const { config, ratio, echartsOptions, seriesOptions, seriesColors, isMap, extraHeight, width } =
		option;

	let initOpts = { renderer: 'canvas' };
	if (isMap) {
		initOpts.height = width * 0.5 + extraHeight;
		if (node && node.parentNode) {
			// node.parentNode refers to the chart's container
			node.style.height = initOpts.height + 'px';
			node.parentNode.style.height = initOpts.height + 'px';
		}
	}

	const chart = init(node, 'evidence-light', initOpts);
	config.animation = false; // disable animation

	chart.setOption(config);
	// Check if echartsOptions are provided and apply them
	if (echartsOptions) {
		chart.setOption(echartsOptions);
	}

	// Series Color override
	const applySeriesColors = () => {
		if (seriesColors) {
			/** @type {import("echarts").EChartsOption} */
			const prevOption = chart.getOption();
			if (!prevOption) return;
			const newOption = { ...prevOption };
			for (const seriesName of Object.keys(seriesColors)) {
				const matchingSeriesIndex = prevOption.series.findIndex((s) => s.name === seriesName);
				if (matchingSeriesIndex !== -1) {
					newOption.series[matchingSeriesIndex] = {
						...newOption.series[matchingSeriesIndex],
						itemStyle: {
							...newOption.series[matchingSeriesIndex].itemStyle,
							color: seriesColors[seriesName]
						}
					};
				}
			}
			chart.setOption(newOption);
		}
	};

	// Check if echartsOptions are provided and apply them
	const applyEchartsOptions = () => {
		if (echartsOptions) {
			chart.setOption({
				...echartsOptions
			});
		}
	};

	// seriesOptions - loop through series and apply same changes to each
	const applySeriesOptions = () => {
		let tempSeries = [];
		if (seriesOptions) {
			const reference_index = config.series.reduce(
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

			for (let i = 0; i < config.series.length; i++) {
				if (reference_index.includes(i)) {
					tempSeries.push({});
				} else {
					tempSeries.push({ ...seriesOptions });
				}
			}
			chart.setOption({ series: tempSeries });
		}
	};

	applyEchartsOptions();
	applySeriesColors();
	applySeriesOptions();

	let src = chart.getConnectedDataURL({
		type: 'jpeg',
		pixelRatio: ratio,
		backgroundColor: '#fff',
		excludeComponents: ['toolbox']
	});

	// Replace the contents with an img tag
	node.innerHTML = `<img src=${src} width="100%" style="
        position: absolute; 
        top: 0;
        user-select: all;
        -webkit-user-select: all;
        -moz-user-select: all;
        -ms-user-select: all;
    " />`;

	option.config.animation = true; // re-enable animation
};
