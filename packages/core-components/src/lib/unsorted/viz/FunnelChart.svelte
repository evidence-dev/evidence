<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import ECharts from './ECharts.svelte';

	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { colours } from '@evidence-dev/component-utilities/colours';

	export let data = undefined;
	export let nameCol = undefined;
	export let valueCol = undefined;

	export let valueFmt = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = true;
	legend = legend === 'true' || legend === true;

	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let labelPosition = 'inside';
	export let funnelAlign = 'center';
	export let funnelSort = 'none';

	// ---------------------------------------------------------------------------------------
	// Variable Declaration
	// ---------------------------------------------------------------------------------------
	// Column Summary:
	let columnSummary;
	let nameColFormat;

	// Chart area sizing:
	let chartAreaHeight;
	let hasTitle;
	let hasSubtitle;
	let hasLegend;
	let titleFontSize;
	let subtitleFontSize;
	let titleBoxPadding;
	let titleBoxHeight;
	let chartAreaTopPosition;
	let chartAreaPaddingTop;
	let chartAreaPaddingBottom;
	let legendHeight;
	let legendPaddingTop;
	let legendTop;
	let chartTop;
	let chartBottom;
	let chartContainerHeight;

	// Set final chart height:
	let height;
	let width;

	// set min and max
	let min = 0;
	let max;

	$: columnSummary = getColumnSummary(data);
	$: name = name ?? formatTitle(valueCol, columnSummary[nameCol].title);
	$: nameColFormat = columnSummary[nameCol].format;
	let valueColFormat;
	$: if (valueFmt) {
		valueFmt = getFormatObjectFromString(valueFmt, columnSummary[valueCol].format.valueType);
		valueColFormat = valueFmt;
	} else {
		valueColFormat = columnSummary[valueCol].format;
	}

	// ---------------------------------------------------------------------------------------
	// Set up chart area
	// ---------------------------------------------------------------------------------------
	chartAreaHeight = 220; // standard height for chart area across all charts

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
	chartAreaTopPosition =
		(hasLegend ? 30 : 10) + hasTitle * 23 + (hasTitle ? hasSubtitle * 25 : hasSubtitle * 30);
	chartAreaPaddingTop = 2;
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

	$: data.forEach((item) => {
		if (max < item[valueCol] || !max) max = item[valueCol];
	});

	$: seriesConfig = {
		type: 'funnel',
		name,
		left: funnelAlign === 'center' ? '10%' : '',
		top: chartAreaTopPosition,
		bottom: 10,
		width: '80%',
		min,
		max,
		minSize: '30%',
		maxSize: '90%',
		gap: 2,

		funnelAlign,
		sort: funnelSort,

		labelLine: {
			length: 10,
			lineStyle: {
				width: 1,
				type: 'solid'
			}
		},
		label: {
			show: true,
			position: labelPosition,
			formatter: function (params) {
				return formatValue(params.value, valueColFormat);
			}
		},
		labelLayout: { hideOverlap: true },
		emphasis: {
			focus: 'series'
		},
		itemStyle: {
			borderColor: outlineColor,
			borderWidth: outlineWidth
		},
		tooltip: {
			formatter: function (params) {
				return `<span style='font-weight:600;'>${formatValue(
					params.name,
					nameColFormat
				)}</span></br><span>${name}:</span><span style='margin-left: 4px;'> ${params.value}</span>`;
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
		data: data.map((d) => ({ name: d[nameCol], value: d[valueCol] }))
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
			orient: 'horizontal',
			type: 'scroll',
			top: legendTop,
			padding: [0, 0, 0, 0]
		},
		series: [seriesConfig]
	};
</script>

<ECharts {config} {width} {height} />
