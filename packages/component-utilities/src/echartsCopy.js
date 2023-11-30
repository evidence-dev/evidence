import { registerTheme, init } from 'echarts';
import { evidenceThemeLight } from './echartsThemes';

export default (node, option) => {
	registerTheme('evidence-light', evidenceThemeLight);

	const { config, ratio, echartsOptions } = option;

	const chart = init(node, 'evidence-light', { renderer: 'canvas' });
	config.animation = false; // disable animation

	chart.setOption(config);
	// Check if echartsOptions are provided and apply them
	if(echartsOptions) {
		chart.setOption(echartsOptions);
	}

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
};
