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
	import { checkDeprecatedColor } from '../../../deprecated-colors.js';
	import { toBoolean } from '../../../utils.js';

	const { theme, resolveColorPalette, resolveColorScale } = getThemeStores();

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
	$: filter = toBoolean(filter);

	export let legend = false;
	$: legend = toBoolean(legend);

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
	$: colorPalette = checkDeprecatedColor('USMap', 'colorPalette', colorPalette);
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let colorScale = 'default';
	$: colorScale = checkDeprecatedColor('USMap', 'colorScale', colorScale);
	$: colorScaleStore = resolveColorScale(colorScale);

	$: colorArray = $colorPaletteStore ?? $colorScaleStore;

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;
	$: printEchartsConfig = toBoolean(printEchartsConfig);
	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;

	export let connectGroup = undefined;

	export let abbreviations = false;
	$: abbreviations = toBoolean(abbreviations);

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
					color: $theme.colors['base-content-muted'],
					overflow: 'break'
				},
				top: '1px'
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
				textStyle: {
					color: $theme.colors['base-content-muted']
				},
				handleStyle: {
					borderColor: $theme.colors['base-300']
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
						borderColor: $theme.colors['base-300'],
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
	<ErrorChart {error} title={chartType} />
{/if}
