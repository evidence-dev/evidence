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
		},
		args: {
			label: 'Reference Point'
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import LineChart from '$lib/unsorted/viz/line/LineChart.svelte';
	import BarChart from '$lib/unsorted/viz//bar/BarChart.svelte';
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';

	import ReferencePoint from './ReferencePoint.svelte';
	import Callout from './Callout.svelte';

	const data = Query.create(
		`
		select *
		from numeric_series
		where series in (
			select series
			from numeric_series
			order by series asc
			limit 1
		)
		`,
		query
	);
</script>

<Story
	name="Basic hardcoded x,y"
	args={{ x: 24, y: 514, label: 'Whoa look at this data!' }}
	argTypes={{ x: { control: 'number' }, y: { control: 'number' } }}
	let:args
>
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
	{@const referencePointData = Query.create(
		`
		select
			x,
			y,
			row_number() over(order by x) as label
		from numeric_series
		where
			series in (
				select series
				from numeric_series
				order by series asc
				limit 1
			)
			and x in (30, 50, 70)
		`,
		query
	)}
	<QueryLoad {data}>
		<LineChart x="x" y="y" {data}>
			<ReferencePoint {...args} data={referencePointData} />
		</LineChart>
	</QueryLoad>
</Story>

<Story
	name="Label from slot"
	args={{ x: 24, y: 514 }}
	argTypes={{ label: { control: false } }}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args}>This label is passed via the default slot</ReferencePoint>
	</LineChart>
</Story>

<Story name="Swap XY">
	{@const data = Query.create(
		`
			select 'a' as x, 10 as y union all
			select 'b', 20 union all
			select 'c', 30
		`,
		query
	)}
	<BarChart x="x" y="y" swapXY {data}>
		<ReferencePoint x="b" y="30" label="Reference Point" />
	</BarChart>
</Story>

<Story name="Colors">
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
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} />
	</LineChart>
</Story>

<Story id="callout" name="Callout" args={{ x: 24, y: 514, label: 'This is a Callout!' }} let:args>
	<LineChart x="x" y="y" {data}>
		<Callout {...args} />
	</LineChart>
</Story>

<Story
	name="Callout with `labelWidth=fit`"
	args={{ x: 24, y: 514, labelWidth: 'fit', label: 'This is a Callout!' }}
	let:args
>
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
	name="Very styled"
	args={{
		x: 24,
		y: 514,
		labelColor: 'lightgreen',
		labelPadding: 10,
		labelPosition: 'bottom',
		labelBackgroundColor: 'cornflowerblue',
		labelBorderWidth: 3,
		labelBorderRadius: 999,
		labelBorderColor: 'orangered',
		labelBorderType: 'dashed',
		fontSize: 10,
		align: 'center',
		bold: true,
		italic: true,
		symbolSize: 30,
		symbolOpacity: 0.5,
		symbolBorderWidth: 10,
		symbolBorderColor: 'plum'
	}}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} />
	</LineChart>
</Story>

<Story name="Error: Outside of a chart">
	<ReferencePoint label="Reference Point" />
</Story>

<Story
	name="Error: Missing column"
	args={{ x: 'x', y: 'non-existent-column', label: 'label' }}
	argTypes={{ x: { control: 'text' }, y: { control: 'text' } }}
	let:args
>
	{@const referencePointData = Query.create(
		`
		select
			x,
			y,
			row_number() over(order by x) as label
		from numeric_series
		where
			series in (
				select series
				from numeric_series
				order by series asc
				limit 1
			)
			and x in (30, 50, 70)
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} data={referencePointData} />
	</LineChart>
</Story>
