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
			color: {
				control: 'color'
			},
			label: {
				control: 'text'
			},
			labelColor: {
				control: 'color'
			},
			labelWidth: {
				control: 'number'
			},
			labelPadding: {
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
			labelBackgroundColor: {
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
			},
			symbol: {
				control: 'select',
				options: ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']
			},
			symbolColor: {
				control: 'color'
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
			preserveWhitespace: {
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
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';

	import ReferencePoint from './ReferencePoint.svelte';
	import Callout from './Callout.svelte';

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

<Story name="Colors">
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<ReferencePoint x="10" y="100" color="blue" label="blue" />
		<ReferencePoint x="20" y="100" color="red" label="red" />
		<ReferencePoint x="30" y="100" color="yellow" label="yellow" />
		<ReferencePoint x="40" y="100" color="green" label="green" />
		<ReferencePoint x="50" y="100" color="grey" label="grey" />
		<ReferencePoint x="60" y="100" color="#63178f" label="custom" />
	</LineChart>
</Story>

<!-- Specifying x without y -->
<Story name="Error" args={{ x: 24 }} let:args>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} />
	</LineChart>
</Story>

<Story id="callout" name="Callout" args={{ x: 24, y: 514, label: 'This is a Callout!' }} let:args>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<Callout {...args} />
	</LineChart>
</Story>

<Story
	name="Callout with `labelWidth=fit`"
	args={{ x: 24, y: 514, labelWidth: 'fit', label: 'This is a Callout!' }}
	let:args
>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<Callout {...args} />
	</LineChart>
</Story>

<Story
	name="Callout with line breaks"
	args={{ x: 24, y: 514 }}
	argTypes={{ label: { control: false } }}
	let:args
>
	{@const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query)}
	<LineChart x="x" y="y" {data}>
		<!-- prettier-ignore -->
		<Callout {...args}>
			Callout slot label
			with
			line breaks
		</Callout>
	</LineChart>
</Story>

<Story
	name="Error: Missing column"
	args={{ x: 'x', y: 'non-existent-column', label: 'label' }}
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
