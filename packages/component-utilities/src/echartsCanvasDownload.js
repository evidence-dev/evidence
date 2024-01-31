import { registerTheme, init } from 'echarts';
import { evidenceThemeLight } from './echartsThemes';
import download from 'downloadjs';

export default (node, option) => {
	registerTheme('evidence-light', evidenceThemeLight);

	const chart = init(node, 'evidence-light', { renderer: 'canvas' });

	option.animation = false;

	chart.setOption(option);
	// Check if echartsOptions are provided and apply them
	const prevOption = chart.getOption();
	if (prevOption.echartsOptions) {
		chart.setOption(prevOption.echartsOptions);
	}

	let src = chart.getConnectedDataURL({
		type: 'png',
		pixelRatio: 3,
		backgroundColor: 'white',
		excludeComponents: ['toolbox']
	});

	const date = new Date();
	const localISOTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 19)
		.replaceAll(':', '-');

	download(src, (option.evidenceChartTitle ?? option.queryID ?? 'evidence-chart') + `_${localISOTime}.png`);

	chart.dispose();

	return {
		destroy() {
			chart.dispose();
		}
	};
};
