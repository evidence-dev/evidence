<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'viz/references/ReferenceArea',
		component: ReferenceArea
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import LineChart from '$lib/unsorted/viz/line/LineChart.svelte';
	import BarChart from '../../bar/BarChart.svelte';
	import QueryLoad from '../../../../atoms/query-load/QueryLoad.svelte';

	import ReferenceArea from './ReferenceArea.svelte';

	const data = Query.create(`select * FROM numeric_series WHERE series='pink'`, query);
</script>

<Story name="Hardcoded: x">
	<LineChart x="x" y="y" {data}>
		<ReferenceArea xMin={20} xMax={40} label="Reference Area" />
	</LineChart>
</Story>

<Story name="Hardcoded: y">
	<LineChart x="x" y="y" {data}>
		<ReferenceArea yMin={450} yMax={700} label="Reference Area" />
	</LineChart>
</Story>

<Story name="Hardcoded: x/y">
	<LineChart x="x" y="y" {data}>
		<ReferenceArea xMin={20} xMax={40} yMin={450} yMax={700} label="Reference Area" />
	</LineChart>
</Story>

<Story name="Dynamic Data: x">
	{@const referenceAreaData = Query.create(
		`
      select 30 as xMin, 40 as xMax, 'Area 1' as label union all
      select 50, 60, 'Area 2' union all
      select 70, 80, 'Area 3'
    `,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<QueryLoad data={referenceAreaData}>
			<ReferenceArea data={referenceAreaData} xMin="xMin" xMax="xMax" label="label" />
		</QueryLoad>
	</LineChart>
</Story>

<Story name="Dynamic Data: y">
	{@const referenceAreaData = Query.create(
		`
      select 100 as yMin, 150 as yMax, 'Area 1' as label union all
      select 850, 1000, 'Area 2' union all
      select 200, 400, 'Area 3'
    `,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<QueryLoad data={referenceAreaData}>
			<ReferenceArea data={referenceAreaData} yMin="yMin" yMax="yMax" label="label" />
		</QueryLoad>
	</LineChart>
</Story>

<Story name="Dynamic Data: x/y">
	{@const referenceAreaData = Query.create(
		`
      select 30 as xMin, 40 as xMax, 100 as yMin, 150 as yMax, 'Area 1' as label union all
      select 50, 60, 850, 1000, 'Area 2' union all
      select 70, 80, 200, 400, 'Area 3'
    `,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<QueryLoad data={referenceAreaData}>
			<ReferenceArea
				data={referenceAreaData}
				xMin="xMin"
				xMax="xMax"
				yMin="yMin"
				yMax="yMax"
				label="label"
			/>
		</QueryLoad>
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
		<ReferenceArea xMin="a" xMax="a" yMin={15} yMax={25} label="Reference Area" />
	</BarChart>
</Story>

<Story name="Colors">
	<LineChart x="x" y="y" {data}>
		<ReferenceArea xMin="10" xMax="20" color="red" label="red" />
		<ReferenceArea xMin="20" xMax="30" color="yellow" label="yellow" />
		<ReferenceArea xMin="30" xMax="40" color="green" label="green" />
		<ReferenceArea xMin="40" xMax="50" color="blue" label="blue" />
		<ReferenceArea xMin="50" xMax="60" color="grey" label="grey" />
		<ReferenceArea xMin="60" xMax="70" color="#f2dbff" labelColor="#4d1070" label="custom" />
	</LineChart>
</Story>

<Story name="Error: Missing column">
	{@const referenceAreaData = Query.create(
		`
			select 30 as xMin, 40 as xMax, 100 as yMin, 150 as yMax, 'Area 1' as label union all
			select 50, 60, 850, 1000, 'Area 2' union all
			select 70, 80, 200, 400, 'Area 3'
		`,
		query
	)}
	<LineChart x="x" y="y" {data}>
		<QueryLoad data={referenceAreaData}>
			<ReferenceArea
				data={referenceAreaData}
				xMin="xMin"
				xMax="non-existent-column"
				label="label"
			/>
		</QueryLoad>
	</LineChart>
</Story>
