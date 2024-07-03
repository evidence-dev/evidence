import { registerTheme, init } from 'echarts';
import { evidenceThemeLight } from './echartsThemes';
import download from 'downloadjs';
import Logo from './wordmark-white.svg';

export default (node, option) => {
	registerTheme('evidence-light', evidenceThemeLight);

	const chart = init(node, 'evidence-light', { renderer: 'canvas' });

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
					if (evidenceSeriesType === 'reference_line' || evidenceSeriesType === 'reference_area') {
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


	// Set desired download width
	const desiredWidth = 400; // example width
	const originalWidth = node.offsetWidth;
	node.style.width = `${desiredWidth}px`;
	chart.resize();

	let originalDataURL = chart.getConnectedDataURL({
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

	
	// create an image element to load the original chart image
	let originalImage = new Image();
	originalImage.src = originalDataURL;

	originalImage.onload = function () {
		// set padding and margin values
		let padding = 40;
		let margin = 100;
		let cornerRadius = 10;

		// create a new canvas with added padding and margin
		let canvas = document.createElement('canvas');
		canvas.width = originalImage.width + padding * 2 + margin * 2;
		canvas.height = originalImage.height + padding * 2 + margin * 2;
		let ctx = canvas.getContext('2d');

		// create gradient background
		let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		gradient.addColorStop(0, '#ff7e5f');
		gradient.addColorStop(1, '#feb47b');

		// fill the canvas with gradient background
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// add drop shadow
		ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 5;
		ctx.shadowOffsetY = 5;

		// draw rounded rectangle for white margin
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.moveTo(margin + cornerRadius, margin);
		ctx.lineTo(canvas.width - margin - cornerRadius, margin);
		ctx.quadraticCurveTo(canvas.width - margin, margin, canvas.width - margin, margin + cornerRadius);
		ctx.lineTo(canvas.width - margin, canvas.height - margin - cornerRadius);
		ctx.quadraticCurveTo(canvas.width - margin, canvas.height - margin, canvas.width - margin - cornerRadius, canvas.height - margin);
		ctx.lineTo(margin + cornerRadius, canvas.height - margin);
		ctx.quadraticCurveTo(margin, canvas.height - margin, margin, canvas.height - margin - cornerRadius);
		ctx.lineTo(margin, margin + cornerRadius);
		ctx.quadraticCurveTo(margin, margin, margin + cornerRadius, margin);
		ctx.closePath();
		ctx.fill();
		ctx.shadowColor = 'transparent'; // disable shadow for further drawing

		// add thin gray border
		ctx.strokeStyle = 'rgba(200, 200, 200, 1)';
		ctx.lineWidth = 1;
		ctx.stroke();


		// draw the original image onto the new canvas with padding and margin
		ctx.drawImage(originalImage, margin + padding, margin + padding);

		// // add watermark
		// ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
		// ctx.font = '30px Inter';
		// ctx.textAlign = 'center';
		// ctx.textBaseline = 'middle';
		// ctx.fillText('Created with Evidence', canvas.width / 2, canvas.height - margin / 2);

		let watermarkImage = new Image();
		watermarkImage.src = Logo;

		watermarkImage.onload = function () {

			

			// draw the watermark PNG onto the canvas
			ctx.drawImage(watermarkImage, canvas.width / 2 - watermarkImage.width / 8, canvas.height - margin / 2 - watermarkImage.height / 8, watermarkImage.width / 4, watermarkImage.height / 4);

			// create a download link for the new image
			let link = document.createElement('a');
			link.href = canvas.toDataURL('image/png');
			download(
				link.href,
				(option.evidenceChartTitle ?? option.queryID ?? 'evidence-chart') + `_${localISOTime}.png`
			);
		}
	};
	
	// Reset the node width after capturing the image
	node.style.width = `${originalWidth}px`;
	chart.resize();

	chart.dispose();

	return {
		destroy() {
			chart.dispose();
		}
	};
};
