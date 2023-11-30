<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import ECharts from './ECharts.svelte';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';

	export let data = undefined;
	export let sourceCol = 'source';
	export let targetCol = 'target';
	export let valueCol = 'value';

	export let valueFmt = undefined;
	$: format_object = valueFmt ? getFormatObjectFromString(valueFmt) : undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = false;

	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let nodeAlign = 'justify';
	export let nodeGap = 8;
	export let nodeWidth = 20;
	export let orient = 'horizontal';

	export let colorPalette = undefined;
	export let echartsOptions = undefined;
	export let printEchartsConfig = false;

	//Data Formatting
	let names = [];
	let links;
	data.map((link) => names.push(link[sourceCol], link[targetCol]));
	let nameData = [...new Set(names)].map((node) => ({ name: node }));
	$: links = data.map((link) => {
		return {
			source: link[sourceCol],
			target: link[targetCol],
			value: link[valueCol]
		};
	});
	// ---------------------------------------------------------------------------------------
	// Variable Declaration
	// ---------------------------------------------------------------------------------------

	//Chart Area sizing:
	let chartAreaHeight;
	let hasTitle;
	let hasSubtitle;
	let hasLegend;
	let titleFontSize;
	let subtitleFontSize;
	let titleBoxPadding;
	let titleBoxHeight;
	let chartAreaPaddingTop;
	let chartAreaPaddingBottom;
	let legendHeight;
	let legendPaddingTop;
	let legendTop;
	let chartTop;
	let chartBottom;
	let chartContainerHeight;

	// Set final chart height:
	let height = '400px';
	let width = '100%';

	// ---------------------------------------------------------------------------------------
	// Set up chart area
	// ---------------------------------------------------------------------------------------
	chartAreaHeight = 300; // standard height for chart area across all charts
	hasTitle = title ? true : false;
	hasSubtitle = subtitle ? true : false;
	hasLegend = legend;

	titleFontSize = 15;
	subtitleFontSize = 13;
	titleBoxPadding = 10 * hasSubtitle;
	titleBoxHeight =
		hasTitle * titleFontSize +
		hasSubtitle * subtitleFontSize +
		titleBoxPadding * Math.max(hasTitle, hasSubtitle);
	chartAreaPaddingTop = 10;
	chartAreaPaddingBottom = 8;

	legendHeight = 15;
	legendHeight = legendHeight * hasLegend;

	legendPaddingTop = 7;
	legendPaddingTop = legendPaddingTop * Math.max(hasTitle, hasSubtitle);

	legendTop = titleBoxHeight + legendPaddingTop;
	chartTop = legendTop + legendHeight + chartAreaPaddingTop;
	chartBottom = chartAreaPaddingBottom;
	chartContainerHeight = chartAreaHeight + chartTop + chartBottom;

	// Set final chart height:
	height = chartContainerHeight + 'px';
	width = '100%';

	// ---------------------------------------------------------------------------------------
	// Chart Configuration
	// ---------------------------------------------------------------------------------------

	let seriesConfig;
	$: seriesConfig = {
		type: 'sankey',
		layout: 'none',
		left: '10%',
		top: orient === 'vertical' ? 80 : 60,
		bottom: orient === 'vertical' ? 0 : 10,
		width: '70%',
		nodeGap: nodeGap,
		nodeWidth: nodeWidth,
		nodeAlign: nodeAlign,
		orient: orient,
		emphasis: {
			focus: 'adjacency'
		},
		label: {
			show: true,
			position: orient === 'vertical' ? 'top' : 'right',
			fontSize: 12
		},
		itemStyle: {
			borderColor: outlineColor,
			borderWidth: outlineWidth
		},
		tooltip: {
			formatter: function (params) {
				return params.data.name
					? `<span style='font-weight: 600'>${formatValue(params.data.name)}</span>: ${formatValue(
							params.value,
							format_object
					  )}`
					: `<span style='font-weight: 600'>${formatValue(params.data[sourceCol])} to ${formatValue(
							params.data.target
					  )}</span>: ${formatValue(params.data.value, format_object)}`;
			},
			extraCssText:
				'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
			order: 'valueDesc'
		},
		data: nameData,
		links: links,
		animationDuration: 500
	};

	$: config = {
		title: {
			text: title,
			subtext: subtitle,
			subtextStyle: {
				width: width
			}
		},
		tooltip: {
			trigger: 'item'
		},
		legend: {
			show: legend,
			type: 'scroll',
			top: legendTop,
			padding: [0, 0, 0, 0]
		},
		series: [seriesConfig],
		color: colorPalette
	};
</script>

<ECharts {config} {width} {height} {echartsOptions} {printEchartsConfig}/>
