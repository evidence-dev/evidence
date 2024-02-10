import { registerTheme, init } from 'echarts';
import { evidenceThemeLight } from './echartsThemes';

export default (node, option) => {
	registerTheme('evidence-light', evidenceThemeLight);

	const { config, ratio, echartsOptions, seriesEchartsOptions } = option;

	const chart = init(node, 'evidence-light', { renderer: 'canvas' });
	config.animation = false; // disable animation

	chart.setOption(config);
	// Check if echartsOptions are provided and apply them
	if (echartsOptions) {
		chart.setOption(echartsOptions);
	}

	let tempSeries = [];
	let prevOption = chart.getOption();
	if (seriesEchartsOptions) {
		const reference_index = prevOption.series.reduce((acc, {evidenceSeriesType}, reference_index) => {
			if (evidenceSeriesType === 'reference_line' || evidenceSeriesType === 'reference_area') {
			  acc.push(reference_index);
			}
			return acc;
		  }, []);

	  	for(let i=0; i < prevOption.series.length; i++){
			if(reference_index.includes(i)){
				tempSeries.push({})
			} else {
				tempSeries.push({...seriesEchartsOptions})
			}
		}
		chart.setOption({series: tempSeries})
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
