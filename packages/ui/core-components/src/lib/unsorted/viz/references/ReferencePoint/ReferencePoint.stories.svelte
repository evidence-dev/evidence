<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'viz/references/ReferencePoint',
		component: ReferencePoint,
		argTypes: {
			emptySet: {
				control: 'select',
				options: ['pass', 'warn', 'error']
			},
			emptyMessage: {
				control: 'text'
			},
			label: {
				control: 'text'
			},
			symbol: {
				control: 'select',
				options: ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']
			},
			symbolSize: {
				control: 'number'
			},
			symbolOpacity: {
				control: 'number'
			},
			symbolBorderWidth: {
				control: 'number'
			},
			symbolBorderColor: {
				control: 'color'
			},
			color: {
				control: 'color'
			},
			labelColor: {
				control: 'color'
			},
			symbolColor: {
				control: 'color'
			},
			labelWidth: {
				control: 'number'
			},
			labelPosition: {
				control: 'select',
				options: [
					'left',
					'right',
					'top',
					'bottom',
					'inside',
					'insideLeft',
					'insideRight',
					'insideTop',
					'insideBottom',
					'insideTopLeft',
					'insideTopRight',
					'insideBottomLeft',
					'insideBottomRight'
				]
			},
			labelBackground: {
				control: 'color'
			},
			labelBorderWidth: {
				control: 'number'
			},
			labelBorderRadius: {
				control: 'number'
			},
			labelBorderColor: {
				control: 'color'
			},
			labelBorderType: {
				control: 'select',
				options: ['solid', 'dotted', 'dashed']
			},
			labelVisible: {
				control: 'select',
				options: ['always', 'hover']
			},
			fontSize: {
				control: 'number'
			},
			align: {
				control: 'select',
				options: ['left', 'center', 'right']
			},
			bold: {
				control: 'boolean'
			},
			italic: {
				control: 'boolean'
			}
		}
	};
</script>

<script>
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import LineChart from '$lib/unsorted/viz/line/LineChart.svelte';

	import ReferencePoint from './ReferencePoint.svelte';
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';

	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<Story
	name="Basic hardcoded x,y"
	args={{ x: 24, y: 514, label: 'Whoa look at this data!' }}
	argTypes={{ x: { control: 'number' }, y: { control: 'number' } }}
	let:args
>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} />
	</LineChart>
</Story>

<Story
	name="Using dynamic data"
	args={{ x: 'x', y: 'y', label: 'label' }}
	argTypes={{ x: { control: 'text' }, y: { control: 'text' } }}
	let:args
>
	{@const chartData = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	{@const referencePointData = Query.create(
		`
		SELECT
			x,
			y,
			row_number() over(order by x) as label
		FROM numeric_series
		WHERE
			series='pink' AND
			x in (30, 50, 70)
	`,
		query
	)}

	<QueryLoad data={chartData}>
		<LineChart x="x" y="y" data={chartData}>
			<QueryLoad data={referencePointData}>
				<ReferencePoint {...args} data={referencePointData} />
			</QueryLoad>
		</LineChart>
	</QueryLoad>
</Story>

<Story
	name="Label from slot"
	args={{ x: 24, y: 514 }}
	argTypes={{ label: { control: false } }}
	let:args
>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args}>This label is passed via the default slot</ReferencePoint>
	</LineChart>
</Story>

<!-- Specifying x without y -->
<Story name="Error" args={{ x: 24 }} let:args>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} />
	</LineChart>
</Story>
