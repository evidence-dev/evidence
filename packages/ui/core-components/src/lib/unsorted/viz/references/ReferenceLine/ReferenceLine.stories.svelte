<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'viz/references/ReferenceLine',
		component: ReferenceLine,
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
			color: {
				control: 'color'
			},
			symbol: {
				control: 'select',
				options: ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']
			},
			symbolSize: {
				control: 'number'
			},
			symbolStart: {
				control: 'select',
				options: ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']
			},
			symbolStartSize: {
				control: 'number'
			},
			symbolEnd: {
				control: 'select',
				options: ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']
			},
			symbolEndSize: {
				control: 'number'
			},
			lineType: {
				control: 'select',
				options: ['solid', 'dotted', 'dashed']
			},
			lineColor: {
				control: 'color'
			},
			lineWidth: {
				control: 'number'
			},
			hideValue: {
				control: 'boolean'
			},
			labelColor: {
				control: 'color'
			},
			labelPadding: {
				control: 'number'
			},
			labelPosition: {
				control: 'select',
				options: ['aboveStart', 'aboveCenter', 'aboveEnd', 'belowStart', 'belowCenter', 'belowEnd']
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
			preserveWhitespace: {
				control: 'boolean'
			}
		},
		args: {
			label: 'Reference Line'
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import LineChart from '$lib/unsorted/viz/line/LineChart.svelte';
	import BarChart from '$lib/unsorted/viz/bar/BarChart.svelte';
	import { Slider } from '$lib/atoms/inputs/slider';
	import { userEvent, within } from '@storybook/test';
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';

	import ReferenceLine from './ReferenceLine.svelte';

	const inputStore = getInputContext();

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

<Story name="Hardcoded: x" argTypes={{ x: { control: 'number' } }} args={{ x: 50 }} let:args>
	<LineChart x="x" y="y" {data}>
		<ReferenceLine {...args} />
	</LineChart>
</Story>

<Story
	name="Hardcoded: x with symbols"
	argTypes={{ x: { control: 'number' } }}
	args={{ x: 50, symbolStart: 'arrow', symbolEnd: 'square' }}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceLine {...args} />
	</LineChart>
</Story>

<Story name="Hardcoded: y" argTypes={{ y: { control: 'number' } }} args={{ y: 600 }} let:args>
	<LineChart x="x" y="y" {data}>
		<ReferenceLine {...args} />
	</LineChart>
</Story>

<Story
	name="Hardcoded: y with symbols"
	argTypes={{ y: { control: 'number' } }}
	args={{ y: 600, symbol: 'arrow', symbolStart: 'circle' }}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceLine {...args} />
	</LineChart>
</Story>

<Story
	name="Hardcoded: sloped"
	argTypes={{
		x: { control: 'number' },
		y: { control: 'number' },
		x2: { control: 'number' },
		y2: { control: 'number' }
	}}
	args={{
		x: 50,
		y: 600,
		x2: 60,
		y2: 700
	}}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceLine {...args} />
	</LineChart>
</Story>

<Story
	name="Hardcoded: sloped with symbols"
	argTypes={{
		x: { control: 'number' },
		y: { control: 'number' },
		x2: { control: 'number' },
		y2: { control: 'number' }
	}}
	args={{
		x: 50,
		y: 600,
		x2: 60,
		y2: 700,
		symbol: 'arrow'
	}}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceLine {...args} />
	</LineChart>
</Story>

<Story name="Dynamic Data: x">
	{@const referenceLineData = Query.create(
		`
			select 30 as x, 'Line 1' as label union all
			select 50, 'Line 2' union all
			select 70, 'Line 3'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferenceLine data={referenceLineData} x="x" label="label" />
	</LineChart>
</Story>

<Story
	name="Dynamic Data: x with symbols"
	args={{ symbolStart: 'circle', symbolEnd: 'arrow' }}
	let:args
>
	{@const referenceLineData = Query.create(
		`
			select 30 as x, 'Line 1' as label union all
			select 50, 'Line 2' union all
			select 70, 'Line 3'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferenceLine data={referenceLineData} x="x" label="label" {...args} />
	</LineChart>
</Story>

<Story name="Dynamic Data: y">
	{@const referenceLineData = Query.create(
		`
			select 300 as y, 'Line 1' as label union all
			select 500, 'Line 2' union all
			select 700, 'Line 3'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferenceLine data={referenceLineData} y="y" label="label" />
	</LineChart>
</Story>

<Story
	name="Dynamic Data: y with symbols"
	args={{ symbolStart: 'rect', symbolEnd: 'arrow' }}
	let:args
>
	{@const referenceLineData = Query.create(
		`
			select 300 as y, 'Line 1' as label union all
			select 500, 'Line 2' union all
			select 700, 'Line 3'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferenceLine data={referenceLineData} y="y" label="label" {...args} />
	</LineChart>
</Story>

<Story name="Dynamic Data: sloped">
	{@const referenceLineData = Query.create(
		`
			select 30 as x, 300 as y, 40 as x2, 400 as y2, 'Line 1' as label union all
			select 50, 500, 60, 400, 'Line 2' union all
			select 80, 800, 70, 1, 'Line 3' union all
			select 20, 400, 10, 1000, 'Line 4'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferenceLine data={referenceLineData} x="x" y="y" x2="x2" y2="y2" label="label" />
	</LineChart>
</Story>

<Story name="Dynamic Data: sloped with symbols" args={{ symbol: 'arrow' }} let:args>
	{@const referenceLineData = Query.create(
		`
			select 30 as x, 300 as y, 40 as x2, 400 as y2, 'Line 1' as label union all
			select 50, 500, 60, 400, 'Line 2' union all
			select 80, 800, 70, 1, 'Line 3' union all
			select 20, 400, 10, 1000, 'Line 4'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferenceLine data={referenceLineData} x="x" y="y" x2="x2" y2="y2" label="label" {...args} />
	</LineChart>
</Story>

<Story
	name="Reactive"
	play={async ({ canvasElement }) => {
		// Reference line should move when X value is updated
		await data.fetch();
		const canvas = within(canvasElement);
		const slider = await canvas.getByRole('slider');
		slider.focus();
		await userEvent.keyboard('[ArrowRight]');
	}}
>
	<Slider name="x" title="X" defaultValue={50} min={0} max={100} />

	<LineChart x="x" y="y" {data}>
		<ReferenceLine x={$inputStore.x} label="Reference Line" />
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
		<ReferenceLine y="20" label="Reference Area" />
	</BarChart>
</Story>

<Story name="Colors">
	<LineChart x="x" y="y" {data}>
		<ReferenceLine x="10" color="red" label="red" />
		<ReferenceLine x="20" color="yellow" label="yellow" />
		<ReferenceLine x="30" color="green" label="green" />
		<ReferenceLine x="40" color="blue" label="blue" />
		<ReferenceLine x="50" color="grey" label="grey" />
		<ReferenceLine x="60" color="#63178f" label="custom" />
	</LineChart>
</Story>

<Story
	name="Very styled"
	args={{
		x: 50,
		lineType: 'dotted',
		lineColor: 'red',
		lineWidth: 5,
		hideValue: true,
		labelColor: 'cyan',
		labelPadding: 10,
		labelPosition: 'belowCenter',
		labelBackgroundColor: 'purple',
		labelBorderWidth: 12,
		labelBorderRadius: 8,
		labelBorderColor: 'orangered',
		labelBorderType: 'dashed',
		fontSize: 15,
		align: 'center',
		bold: true,
		italic: true
	}}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceLine {...args} />
	</LineChart>
</Story>

<Story name="Error: Outside of a chart">
	<ReferenceLine x={50} label="Reference Line" />
</Story>

<Story name="Error: Missing column">
	{@const referenceLineData = Query.create(
		`
			select 30 as x, 'Line 1' as label union all
			select 50, 'Line 2' union all
			select 70, 'Line 3'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<ReferenceLine data={referenceLineData} x="non-existent-column" label="label" />
	</LineChart>
</Story>
