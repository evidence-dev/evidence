<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/BubbleCharts',
		argTypes: {
			xHasGaps: {
				type: 'boolean',
				description: 'Determines if every series has every x value',
				defaultValue: false
			},
			yHasNulls: {
				type: 'boolean',
				description: 'Determines if y can have nulls',
				defaultValue: false
			},
			seriesAlwaysExists: {
				type: 'boolean',
				description: 'Determines if the series prop can be null',
				defaultValue: true
			},
			type: {
				type: 'string',
				options: ['stacked', 'grouped', 'stacked100'],
				control: { type: 'select' }
			}
		},
		args: {
			xHasGaps: false,
			yHasNulls: false,
			seriesAlwaysExists: true,
			size: 'y'
		}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';

	import BubbleChart from './BubbleChart.svelte';

	import { fakerSeries } from '$lib/faker-data-queries';

	let brokenData = [
		{
			x: null,
			y: null,
			series: 'missing'
		}
	];

	const fixBrokenData = () => {
		brokenData = [...brokenData, { x: 5, y: 5, series: 'appears' }];
	};

	const rebreakData = () => {
		brokenData = brokenData.filter((d) => d.x === null);
	};
</script>

<Template let:args>
	<BubbleChart
		{...args}
		x="x"
		y="y"
		series="series"
		size={args.size}
		data={fakerSeries['numeric_series'][args.xHasGaps][args.yHasNulls][args.seriesAlwaysExists]
			.store}
	/>
</Template>

<Story name="Base" />

<Story name="Multiple Series, X null all instances of one">
	<BubbleChart x="x" y="y" series="series" data={brokenData} legend sort={false} size="y" />
	<div class="flex gap-2">
		<button on:click={fixBrokenData}>Fix It</button>
		<button on:click={rebreakData}>Rebreak it</button>
	</div>

	<BubbleChart x="x" y="y" series="series" size="y" data={[]} legend sort={false} />
</Story>
