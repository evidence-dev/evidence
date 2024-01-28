<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import ECharts from '../core/ECharts.svelte';
	import { strictBuild } from '../context';

	import { chartColours } from '@evidence-dev/component-utilities/colours';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import ErrorChart from '../core/ErrorChart.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';

	export let echartsOptions = undefined;
	export let printEchartsConfig = false;

	export let valueFmt = undefined;
	$: value_format_object = valueFmt ? getFormatObjectFromString(valueFmt) : undefined;

	export let percentFmt = undefined;
	$: percent_format_object = percentFmt ? getFormatObjectFromString(percentFmt) : getFormatObjectFromString('pct') ;

	export let colorPalette = undefined;

	export let data = undefined;
	export let sourceCol = 'source';
	export let targetCol = 'target';
	export let valueCol = 'value';
	export let percentCol = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let nodeLabels = true;
	$: nodeLabels = nodeLabels === 'true' || nodeLabels === true;

	export let linkLabels = undefined; // value | percent | full | undefined (default)

	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let nodeAlign = 'justify';
	export let nodeGap = 10;
	export let nodeWidth = 20;
	export let orient = 'horizontal';
	export let sort = false;

	export let depthOverride; // object like: {'node name': 1, 'node name 2': 2} where number is depth level (0-based)

	export let linkColor = 'grey'; // grey (default), source, target, gradient

	// Data Formatting
	let names = [];
	let links;

	let combinedPalette = [...(colorPalette ?? []), ...chartColours];

	// error handling
	let error;


	// ---------------------------------------------------------------------------------------
	// Variable Declaration
	// ---------------------------------------------------------------------------------------

	// Chart Area sizing:
	export let chartAreaHeight = '300';
	chartAreaHeight = Number(chartAreaHeight);
	let hasTitle;
	let hasSubtitle;
	let titleFontSize;
	let subtitleFontSize;
	let titleBoxPadding;
	let titleBoxHeight;
	let chartAreaPaddingTop;
	let chartAreaPaddingBottom;
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

	let config;

	// ---------------------------------------------------------------------------------------
	// Check Inputs
	// ---------------------------------------------------------------------------------------
	$: try{
		// if (!value) {
		// 	throw new Error('value is required');
		// }

		checkInputs(data, [sourceCol, targetCol, valueCol], [percentCol]);


		data.map((link) => {
			names.push(link[sourceCol], link[targetCol])
		});

		const nameData = [...new Set(names)].map((node, index) => ({
			name: node,
			itemStyle: {
				color: combinedPalette[index % combinedPalette.length]
			}
		}));
		links = data.map((link) => {
			return {
				source: link[sourceCol],
				target: link[targetCol],
				value: link[valueCol],
				percent: link[percentCol]
			};
		});
	// ---------------------------------------------------------------------------------------
	// Set up chart area
	// ---------------------------------------------------------------------------------------

	// check if chartAreaHeight is a positive number - if not, throw error (otherwise get blank space)
	if (isNaN(chartAreaHeight)) {
		throw Error("chartAreaHeight must be a number")
	} else if(chartAreaHeight < 0){
		throw Error("chartAreaHeight must be a positive number")
	}
	
	hasTitle = title ? true : false;
	hasSubtitle = subtitle ? true : false;

	titleFontSize = 15;
	subtitleFontSize = 13;
	titleBoxPadding = 10 * hasSubtitle;
	titleBoxHeight =
		hasTitle * titleFontSize +
		hasSubtitle * subtitleFontSize +
		titleBoxPadding * Math.max(hasTitle, hasSubtitle);
	chartAreaPaddingTop = 10;
	chartAreaPaddingBottom = 8;

	chartTop = chartAreaPaddingTop;
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
	seriesConfig = {
		type: 'sankey',
		layout: 'none',
		layoutIterations: sort === 'true' ? 32 : 0, // Preserve data order in layout
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
			show: nodeLabels,
			position: orient === 'vertical' ? 'top' : 'right',
			fontSize: orient === 'vertical' ? 10.5 : 12,
			formatter: function (params) {
				return `${formatTitle(params.data.name)}`;
			}
		},
		edgeLabel: {
			show: ['value', 'percent', 'full'].includes(linkLabels),
			color: 'black',
			textBorderColor: 'white',
			textBorderWidth: 2,
			formatter: function (params) {
				let output;
				if(linkLabels === 'value'){
					output = `${formatValue(params.data.value, value_format_object)}` 
				} else if(linkLabels === 'percent'){
					output = percentCol ? `${formatValue(params.data.percent, percent_format_object )}` : ''
				} else {
					output = `${formatValue(params.data.value, value_format_object)}` + (percentCol ? ` (${formatValue(params.data.percent, percent_format_object )})` : '')
				}
				return output;
			}
		},
		labelLayout: {
			hideOverlap: true
		},
		itemStyle: {
			borderColor: outlineColor,
			borderWidth: outlineWidth
		},
		lineStyle: {
			color: linkColor
		},
		tooltip: {
			formatter: function (params) {
				return params.data.name
					? `<span style='font-weight: 600'>${formatValue(params.data.name)}</span>: ${formatValue(
							params.value,
							value_format_object
					  )}`
					: `<span style='font-weight: 600'>${formatValue(params.data[sourceCol])} to ${formatValue(
							params.data.target
					  )}</span>: ${formatValue(params.data.value, value_format_object)}`;
			},
			extraCssText:
				'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
			order: 'valueDesc'
		},
		data: nameData,
		links: links,
		animationDuration: 500
	};

	function overrideNodeDepth(data, newObj) {
		// Iterate through each element in the data array
		data.forEach(item => {
			// Check if the item's name is a key in newObj
			if (newObj.hasOwnProperty(item.name)) {
				// Add the 'depth' property with the value from newObj
				item.depth = newObj[item.name];
			}
		});
	}
	if(depthOverride){
		overrideNodeDepth(seriesConfig.data, depthOverride)		
	}

	config = {
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
		series: [seriesConfig]
	};
} catch(e) {
	error = e.message;
	console.error('Error in SankeyDiagram: ' + e.message);
	// if the build is in production fail instead of sending the error to the chart
	if (strictBuild) {
		throw error;
	}
}
</script>

{#if error}
	<ErrorChart chartType="Sankey Diagram" {error}/>
{:else}
	<ECharts {config} {width} {height} {echartsOptions} {printEchartsConfig} />
{/if}