<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import ECharts from '../viz/ECharts.svelte';

	import { colours } from '@evidence-dev/component-utilities/colours';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import { colour } from '@evidence-dev/component-utilities/colours';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';

	export let data = undefined;
	export let sourceCol = 'source';
	export let targetCol = 'target';
	export let valueCol = 'value';

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = false;
	export let label = true;

	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let nodeAlign = 'justify';
	export let nodeGap = 10;
	export let nodeWidth = 20;
	export let orient = 'horizontal';
	export let sort = false;

	// Data Formatting
	let names = [];
	let links;
	data.map((link) => names.push(link[sourceCol], link[targetCol]));
	const nameData = [...new Set(names)].map((node, index) => ({
		name: node,
		itemStyle: {
			color: colour[index % colour.length]
		}
	}));
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

	// Chart Area sizing:
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

	// Tooltip formatting:
	let columnSummary;
	let columnNames;

	let sourceFormat;
	let targetFormat;
	let valueFormat;

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
	// Get column information
	// ---------------------------------------------------------------------------------------
	// Get column summary:
	columnSummary = getColumnSummary(data);
	// Get column names:
	columnNames = Object.keys(columnSummary);
	// Get formats:
	sourceFormat = columnSummary[columnNames[0]].format;
	targetFormat = columnSummary[columnNames[1]].format;
	valueFormat = columnSummary[columnNames[2]].format;

	// ---------------------------------------------------------------------------------------
	// Chart Configuration
	// ---------------------------------------------------------------------------------------

	let seriesConfig;
	$: seriesConfig = {
		type: 'sankey',
		layout: 'none',
		layoutIterations: sort === 'true' ? 1 : 0, // Preserve data order in layout
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
			show: label,
			position: orient === 'vertical' ? 'top' : 'right',
			fontSize: orient === 'vertical' ? 10.5 : 12,
			formatter: function (params) {
				return `${formatTitle(params.data.name)}`;
			}
		},
		itemStyle: {
			borderColor: outlineColor,
			borderWidth: outlineWidth
		},
		tooltip: {
			formatter: function (params) {
				return params.data.name
					? `<b>${formatTitle(params.data.name)}</b>`
					: `<b>${formatTitle(params.data[sourceCol], sourceFormat)}</b> → <b>${formatTitle(
							params.data.target,
							targetFormat
					  )}</b><br>${formatValue(params.data.value, valueFormat)}`;
			},
			padding: 6,
			borderRadius: 4,
			borderWidth: 1,
			borderColor: colours.grey400,
			backgroundColor: 'white',
			extraCssText:
				'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
			textStyle: {
				color: colours.grey900,
				fontSize: 12,
				fontWeight: 400
			},
			order: 'valueDesc'
		},

		data: nameData,
		links: links
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
		series: [seriesConfig]
	};
</script>

<ECharts {config} {width} {height} />
