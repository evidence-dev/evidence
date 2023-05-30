import { init, registerMap } from 'echarts';
import usStateMap from './usStateMap.json';

export default (node, option) => {
	registerMap('US', usStateMap);

	let hasLink = option.hasLink;

	const chart = init(node, 'none', { renderer: 'svg' });

	chart.setOption(option.config);

	let resizeObserver;
	const containerElement = document.querySelector('div.content > article');
	const resizeChart = () => {
		chart.resize({
			animation: {
				duration: 500
			}
		});
	};

	if (hasLink) {
		chart.on('click', function (params) {
			if (params.data && params.data.link) {
				window.location = params.data.link;
			}
		});
	}

	if (window.ResizeObserver && containerElement) {
		resizeObserver = new ResizeObserver(resizeChart);
		resizeObserver.observe(containerElement);
	} else {
		window.addEventListener('resize', resizeChart);
	}

	return {
		update(option) {
			chart.setOption(option.config, true, true);
		},
		destroy() {
			if (resizeObserver) {
				resizeObserver.unobserve(containerElement);
			} else {
				window.removeEventListener('resize', resizeChart);
			}
			chart.dispose();
		}
	};
};
