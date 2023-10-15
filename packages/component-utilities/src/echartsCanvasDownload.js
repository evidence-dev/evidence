import { registerTheme, init } from 'echarts';
import { evidenceThemeLight } from './echartsThemes'
import download from 'downloadjs';

export default (node, option) => {
	registerTheme('evidence-light', evidenceThemeLight);

	const chart = init(node, 'evidence-light', { renderer: 'canvas' });

	option.animation = false;

	chart.setOption(option);

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
