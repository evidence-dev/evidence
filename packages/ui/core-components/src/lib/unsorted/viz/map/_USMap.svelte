<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import EChartsMap from './EChartsMap.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import InvisibleLinks from '../../../atoms/InvisibleLinks.svelte';
	import { getThemeStores } from '../../../themes/themes.js';
	import chroma from 'chroma-js';

	const { activeAppearance, theme, resolveColorPalette, resolveColorScale } = getThemeStores();

	export let data = undefined;
	export let queryID = undefined;

	export let state = undefined;
	export let value = undefined;

	export let min = undefined;
	export let max = undefined;

	export let title = undefined;
	export let subtitle = undefined;

	export let fmt = undefined;

	export let filter = false;
	$: filter = filter === 'true' || filter === true;

	export let legend = false;
	$: legend = legend === 'true' || legend === true;

	export let link = undefined;
	let hasLink = link !== undefined;

	let chartType = 'US State Map';
	let error;

	let config;

	let extraHeight = 0;
	let topPosition;

	$: {
		extraHeight = 20;
		topPosition = 30;
		if (title) {
			extraHeight += 20;
			topPosition += 15;
		}

		if (subtitle) {
			extraHeight += 15;
			topPosition += 20;
		}

		if (legend) {
			if (filter) {
				extraHeight += 35;
				topPosition += 35;
			} else {
				extraHeight += 20;
				topPosition += 20;
			}
		}
	}

	export let colorPalette = undefined;
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let colorScale = undefined;
	$: colorScaleStore = resolveColorScale(colorScale);

	let colorArray;
	$: if ($colorPaletteStore) {
		colorArray = [...$colorPaletteStore];
	} else {
		if ($colorScaleStore === 'green') {
			colorArray = [
				'#f7fcfd',
				'#e5f5f9',
				'#ccece6',
				'#99d8c9',
				'#66c2a4',
				'#41ae76',
				'#238b45',
				'#006d2c',
				'#00441b'
			];
		} else if (typeof $colorScaleStore === 'undefined' || $colorScaleStore === 'blue') {
			colorArray = [
				'#f7fbff',
				'#deebf7',
				'#c6dbef',
				'#9ecae1',
				'#6baed6',
				'#4292c6',
				'#2171b5',
				'#08519c',
				'#08306b'
			];
		} else if ($colorScaleStore === 'red') {
			colorArray = [
				'#fff5f0',
				'#fee0d2',
				'#fcbba1',
				'#fc9272',
				'#fb6a4a',
				'#ef3b2c',
				'#cb181d',
				'#a50f15',
				'#67000d'
			];
		} else if ($colorScaleStore === 'bluegreen') {
			colorArray = [
				'#f7fcf0',
				'#e0f3db',
				'#ccebc5',
				'#a8ddb5',
				'#7bccc4',
				'#4eb3d3',
				'#2b8cbe',
				'#0868ac',
				'#084081'
			];
		} else {
			colorArray = $colorScaleStore;
		}
		if ($activeAppearance === 'dark') {
			colorArray = colorArray.map((color) =>
				chroma(color)
					.set('hsl.l', 1 - chroma(color).hsl()[2])
					.saturate(1)
					.brighten(0.5)
					.css()
			);
		}
	}

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;
	$: printEchartsConfig = printEchartsConfig === 'true' || printEchartsConfig === true;
	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;

	export let connectGroup = undefined;

	export let abbreviations = false;
	$: abbreviations = abbreviations === 'true' || abbreviations === true;

	let nameProperty = abbreviations ? 'abbrev' : 'name';

	let columnSummary;
	let format_object;
	let minValue;
	let maxValue;
	let mapData;

	$: try {
		error = undefined;
		if (!state) {
			throw new Error('state is required');
		} else if (!value) {
			throw new Error('value is required');
		}
		checkInputs(data, [state, value]);

		if (min) {
			// if min was user-supplied
			min = Number(min);
			if (isNaN(min)) {
				// input must be a number
				throw Error('min must be a number');
			}
		}

		if (max) {
			// if max was user-supplied
			max = Number(max);
			if (isNaN(max)) {
				// input must be a number
				throw Error('max must be a number');
			}
		}

		minValue = min ?? Math.min(...data.map((d) => d[value]));
		maxValue = max ?? Math.max(...data.map((d) => d[value]));

		columnSummary = getColumnSummary(data);

		// Override format for values:
		if (fmt) {
			format_object = getFormatObjectFromString(fmt, columnSummary[value].format);
		}

		mapData = JSON.parse(JSON.stringify(data));
		for (let i = 0; i < data.length; i++) {
			mapData[i].name = data[i][state];
			mapData[i].value = data[i][value];
			if (link) {
				mapData[i].link = data[i][link];
			}
		}

		config = {
			title: {
				text: title,
				subtext: subtitle,
				padding: 0,
				itemGap: 7,
				textStyle: {
					fontSize: 14,
					color: $theme.colors['base-content']
				},
				subtextStyle: {
					fontSize: 13,
					color: chroma($theme.colors['base-content']).alpha(0.8).css(),
					overflow: 'break'
				},
				top: '0%'
			},
			textStyle: {
				fontFamily: 'sans-serif'
			},
			tooltip: {
				trigger: 'item',
				showDelay: 0,
				transitionDuration: 0.2,
				confine: true,
				axisPointer: {
					// Use axis to trigger tooltip
					type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
				},
				formatter: function (params) {
					let tooltipOutput = `
						<span id="tooltip" style='font-weight: 600;'>${params.name}</span>
						<br/>
						<span>${formatTitle(value, format_object)}: </span>
							<span style='float:right; margin-left: 10px;'>${formatValue(
								Number.isNaN(params.value) ? 0 : params.value,
								format_object
							)}</span>`;

					return tooltipOutput;
				},
				padding: 6,
				borderRadius: 4,
				borderWidth: 1,
				borderColor: $theme.colors['base-300'],
				backgroundColor: $theme.colors['base-100'],
				extraCssText:
					'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
				textStyle: {
					color: $theme.colors['base-content'],
					fontSize: 12,
					fontWeight: 400
				},
				order: 'valueDesc'
			},

			visualMap: {
				type: 'continuous',
				min: minValue,
				max: maxValue,
				itemWidth: 10,
				show: legend,
				left: 'center',
				handleSize: '130%',
				orient: 'horizontal',
				top: (title ? 25 : 0) + (subtitle ? 20 : 0),
				handleStyle: {
					borderColor: $theme.colors['neutral']
				},
				inRange: {
					color: colorArray
				},
				outOfRange: {
					color: $theme.colors['base-300']
				},
				calculable: filter,
				text: filter
					? undefined
					: [formatValue(maxValue, format_object), formatValue(minValue, format_object)],
				formatter: function (value) {
					return formatValue(value, format_object);
				},
				inverse: false
			},
			series: [
				{
					name: formatTitle(value, columnSummary[value].format),
					type: 'map',
					zoom: 1.1,
					top: topPosition,
					left: '8%',
					roam: false,
					map: 'US',
					nameProperty: nameProperty,
					itemStyle: {
						borderColor: $theme.colors['neutral'],
						areaColor: $theme.colors['base-200']
					},
					emphasis: {
						itemStyle: {
							areaColor: $theme.colors['base-200']
						},
						label: {
							show: true,
							color: $theme.colors['base-content']
						}
					},
					select: {
						disabled: false,
						itemStyle: {
							areaColor: $theme.colors['base-300']
						},
						label: {
							color: $theme.colors['base-content']
						}
					},
					data: mapData
				}
			]
		};
	} catch (e) {
		error = e.message;
		if (strictBuild) {
			throw error;
		}
	}

	$: data, config;
</script>

{#if !error}
	<EChartsMap
		{extraHeight}
		{config}
		{data}
		{queryID}
		{hasLink}
		{echartsOptions}
		{seriesOptions}
		{printEchartsConfig}
		{renderer}
		{downloadableData}
		{downloadableImage}
		{connectGroup}
	/>

	{#if link}
		<InvisibleLinks {data} {link} />
	{/if}
{:else}
	<ErrorChart {error} {chartType} />
{/if}
