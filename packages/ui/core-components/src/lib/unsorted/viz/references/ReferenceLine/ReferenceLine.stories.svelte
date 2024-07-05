<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'viz/references/ReferenceLine',
		component: ReferenceLine
	};
</script>

<script>
	import { getContext } from 'svelte';
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import LineChart from '$lib/unsorted/viz/line/LineChart.svelte';
	import { Slider } from '$lib/atoms/inputs/slider';
	import { userEvent, within } from '@storybook/test';
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';

	import ReferenceLine from './ReferenceLine.svelte';

	const inputStore = getContext(INPUTS_CONTEXT_KEY);

	const data = Query.create(`select * FROM numeric_series WHERE series='pink'`, query);
</script>

<Story name="Hardcoded: x">
	<LineChart x="x" y="y" {data}>
		<ReferenceLine x={50} label="Reference Line" />
	</LineChart>
</Story>

<Story name="Hardcoded: y">
	<LineChart x="x" y="y" {data}>
		<ReferenceLine y={600} label="Reference Line" />
	</LineChart>
</Story>

<Story name="Hardcoded: sloped">
	<LineChart x="x" y="y" {data}>
		<ReferenceLine x={50} y={600} x2={60} y2={700} label="Reference Line" />
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
		<QueryLoad data={referenceLineData}>
			<ReferenceLine data={referenceLineData} x="x" label="label" />
		</QueryLoad>
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
		<QueryLoad data={referenceLineData}>
			<ReferenceLine data={referenceLineData} y="y" label="label" />
		</QueryLoad>
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
		<QueryLoad data={referenceLineData}>
			<ReferenceLine data={referenceLineData} x="x" y="y" x2="x2" y2="y2" label="label" />
		</QueryLoad>
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

<Story name="Error: Outside of a chart">
	<ReferenceLine x={50} label="Reference Line" />
</Story>
