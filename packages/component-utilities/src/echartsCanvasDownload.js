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
	if(prevOption.echartsOptions) {
		chart.setOption(prevOption.echartsOptions);
	}

	let src = chart.getConnectedDataURL({
		type: 'png',
		pixelRatio: 3,
		backgroundColor: 'white',
		excludeComponents: ['toolbox']
	});

	download(src, 'evidence-chart.png');

	chart.dispose();

	return {
		destroy() {
			chart.dispose();
		}
	};
};
