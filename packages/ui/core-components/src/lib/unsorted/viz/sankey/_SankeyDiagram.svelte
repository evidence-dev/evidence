<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { ECharts } from '@evidence-dev/core-components';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { ErrorChart } from '@evidence-dev/core-components';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { getThemeStores } from '../../../themes.js';

	const { resolveColor, resolveColorPalette } = getThemeStores();

	export let echartsOptions = undefined;
	export let printEchartsConfig = false;

	export let valueFmt = undefined;
	export let percentFmt = undefined;

	let value_format_object;
	let percent_format_object;

	export let colorPalette = 'default';
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let data = undefined;
	export let sourceCol = 'source';
	export let targetCol = 'target';
	export let valueCol = 'value';
	export let percentCol = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let nodeLabels = 'name'; // name (default) | value | full

	export let linkLabels = undefined; // value | percent | full | undefined (default)

	export let outlineColor = undefined;
	$: outlineColorStore = resolveColor(outlineColor);

	export let outlineWidth = undefined;
	export let nodeAlign = 'justify';
	export let nodeGap = 10;
	export let nodeWidth = 20;
	export let orient = 'horizontal';
	export let sort = false;

	export let depthOverride; // object like: {'node name': 1, 'node name 2': 2} where number is depth level (0-based)

	export let linkColor = 'grey'; // grey (default), source, target, gradient
	$: linkColorStore = resolveColor(linkColor);

	// Data Formatting
	let names = [];
	let links;

	// error handling
	let error;

	function overrideNodeDepth(data, overrideObj) {
		// Iterate through each element in the data array
		data.forEach((item) => {
			// Use call to safely check if the item's name is a key in overrideObj
			if (Object.prototype.hasOwnProperty.call(overrideObj, item.name)) {
				// Add the 'depth' property with the value from overrideObj
				item.depth = overrideObj[item.name];
			}
		});
	}

	// ---------------------------------------------------------------------------------------
	// Variable Declaration
	// ---------------------------------------------------------------------------------------

	// Chart Area sizing:
	export let chartAreaHeight = '300';
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

	let valueFormat;

	let config;

	// ---------------------------------------------------------------------------------------
	// Check Inputs
	// ---------------------------------------------------------------------------------------
	$: try {
		// if (!value) {
		// 	throw new Error('value is required');
		// }

		checkInputs(data, [sourceCol, targetCol, valueCol], [percentCol]);

		data.map((link) => {
			names.push(link[sourceCol], link[targetCol]);
		});

		const nameData = [...new Set(names)].map((node, index) => ({
			name: node,
			itemStyle: {
				color: $colorPaletteStore?.[index % $colorPaletteStore?.length]
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
		if (chartAreaHeight) {
			// if chartAreaHeight was user-supplied
			chartAreaHeight = Number(chartAreaHeight);
			if (isNaN(chartAreaHeight)) {
				// input must be a number
				throw Error('chartAreaHeight must be a number');
			} else if (chartAreaHeight <= 0) {
				throw Error('chartAreaHeight must be a positive number');
			}
		} else {
			chartAreaHeight = 300;
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

		chartTop = chartAreaPaddingTop + titleBoxHeight;
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
		// Get formats:
		valueFormat = columnSummary[valueCol].format;

		// Set column formats
		value_format_object = valueFmt ? getFormatObjectFromString(valueFmt) : valueFormat;

		percent_format_object = percentFmt
			? getFormatObjectFromString(percentFmt)
			: getFormatObjectFromString('pct');

		// ---------------------------------------------------------------------------------------
		// Chart Configuration
		// ---------------------------------------------------------------------------------------

		let seriesConfig;
		seriesConfig = {
			type: 'sankey',
			layout: 'none',
			layoutIterations: sort === 'true' ? 32 : 0, // Preserve data order in layout
			left: '10%',
			top: orient === 'vertical' ? chartTop + 10 : chartTop,
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
				show: ['name', 'value', 'full'].includes(nodeLabels),
				position: orient === 'vertical' ? 'top' : 'right',
				fontSize: orient === 'vertical' ? 10.5 : 12,
				formatter: function (params) {
					let output;
					if (nodeLabels === 'name') {
						output = `${formatTitle(params.data.name)}`;
					} else if (nodeLabels === 'value') {
						output = `${formatValue(params.value, value_format_object)}`;
					} else {
						output = `${formatTitle(params.data.name)} (${formatValue(
							params.value,
							value_format_object
						)})`;
					}
					return output;
				}
			},
			edgeLabel: {
				show: ['value', 'percent', 'full'].includes(linkLabels),
				color: 'black',
				textBorderColor: 'white',
				textBorderWidth: 2,
				formatter: function (params) {
					let output;
					if (linkLabels === 'value') {
						output = `${formatValue(params.data.value, value_format_object)}`;
					} else if (linkLabels === 'percent') {
						output = percentCol ? `${formatValue(params.data.percent, percent_format_object)}` : '';
					} else {
						output =
							`${formatValue(params.data.value, value_format_object)}` +
							(percentCol ? ` (${formatValue(params.data.percent, percent_format_object)})` : '');
					}
					return output;
				}
			},
			labelLayout: {
				hideOverlap: true
			},
			itemStyle: {
				borderColor: $outlineColorStore,
				borderWidth: outlineWidth
			},
			lineStyle: {
				color: $linkColorStore
			},
			tooltip: {
				formatter: function (params) {
					return params.data.name
						? `<span style='font-weight: 600'>${formatValue(
								params.data.name
							)}</span><br/> ${formatValue(params.value, value_format_object)}`
						: `<span style='font-weight: 600'>${formatValue(
								params.data[sourceCol]
							)} &rarr; ${formatValue(params.data.target)}</span><br/> ${formatValue(
								params.data.value,
								value_format_object
							)}`;
				},
				extraCssText:
					'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
				order: 'valueDesc'
			},
			data: nameData,
			links: links,
			animationDuration: 500
		};

		if (depthOverride) {
			overrideNodeDepth(seriesConfig.data, depthOverride);
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
	} catch (e) {
		error = e.message;
		console.error('Error in SankeyDiagram: ' + e.message);
		// if the build is in production fail instead of sending the error to the chart
		if (strictBuild) {
			throw error;
		}
	}
</script>

{#if error}
	<ErrorChart chartType="Sankey Diagram" {error} />
{:else}
	<ECharts {data} {config} {width} {height} {echartsOptions} {printEchartsConfig} />
{/if}
