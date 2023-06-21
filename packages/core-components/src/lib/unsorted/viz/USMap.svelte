<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import EChartsMap from './EChartsMap.svelte';
	import ErrorChart from './ErrorChart.svelte';
	import { strictBuild } from './context';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { colours } from '@evidence-dev/component-utilities/colours';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';

	export let data = undefined;

	export let state = undefined;
	export let value = undefined;

	export let min = undefined;
	export let max = undefined;

	export let title = undefined;
	export let subtitle = undefined;

	export let fmt = undefined;

	export let link = undefined;
	let hasLink = link !== undefined;

	let chartType = 'US State Map';
	let error;

	let config;

	// color palettes
	export let colorScale = 'blue';
	let colorArray;
	$: if (colorScale === 'green') {
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
	} else if (colorScale === 'blue') {
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
	} else if (colorScale === 'red') {
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
	} else if (colorScale === 'bluegreen') {
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
	}

	export let abbreviations = false;
	abbreviations = abbreviations === 'true' || abbreviations === true;

	let nameProperty = abbreviations ? 'abbrev' : 'name';

	let columnSummary;
	$: try {
		error = undefined;
		if (!state) {
			throw new Error('state is required');
		} else if (!value) {
			throw new Error('value is required');
		}
		checkInputs(data, [state, value]);

		let minValue = min ?? Math.min(...data.map((d) => d[value]));
		let maxValue = max ?? Math.max(...data.map((d) => d[value]));

		columnSummary = getColumnSummary(data);

		// Override format for values:
		if (fmt) {
			fmt = getFormatObjectFromString(fmt, columnSummary[value].format);
		}

		let mapData = JSON.parse(JSON.stringify(data));
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
					color: colours.grey700
				},
				subtextStyle: {
					fontSize: 13,
					color: colours.grey600,
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
						<span>${formatTitle(value, fmt)}: </span>
							<span style='float:right; margin-left: 10px;'>${formatValue(params.value, fmt)}</span>`;

					return tooltipOutput;
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

			visualMap: {
				top: 'middle',
				min: minValue,
				max: maxValue,
				itemWidth: 15,
				show: false,
				inRange: {
					color: colorArray
				},
				text: ['High', 'Low'],
				calculable: false,
				inverse: false
			},
			series: [
				{
					name: formatTitle(value, columnSummary[value].format),
					type: 'map',
					zoom: 1.1,
					top: 45,
					roam: false,
					map: 'US',
					nameProperty: nameProperty,
					itemStyle: {
						borderColor: colours.grey400,
						areaColor: colours.grey100
					},
					emphasis: {
						itemStyle: {
							areaColor: colours.grey300
						},
						label: {
							show: true,
							color: colours.grey900
						}
					},
					select: {
						disabled: false,
						itemStyle: {
							areaColor: colours.grey300
						},
						label: {
							color: colours.grey900
						}
					},
					data: mapData
				}
			],
			media: [
				{
					query: {
						maxWidth: 500
					},
					option: {
						series: [
							{
								top: title ? (subtitle ? 48 : 32) : 25,
								zoom: title ? (subtitle ? 0.9 : 1.1) : 1.1
							}
						]
					}
				},
				{
					option: {
						series: [
							{
								top: title ? (subtitle ? 53 : 45) : 35,
								zoom: title ? (subtitle ? 1.1 : 1.1) : 1.1
							}
						]
					}
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
	<EChartsMap {config} {data} {hasLink} />

	{#if link}
		{#each data as row}
			{#if row[link] !== undefined}
				<a href={row[link]} style="display: none;">{row[link]}</a>
			{/if}
		{/each}
	{/if}
{:else}
	<ErrorChart {error} {chartType} />
{/if}
