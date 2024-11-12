<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'viz/references/ReferenceArea',
		component: ReferenceArea,
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
			areaColor: {
				control: 'color'
			},
			opacity: {
				control: 'number'
			},
			border: {
				control: 'boolean'
			},
			borderType: {
				control: 'select',
				options: ['solid', 'dotted', 'dashed']
			},
			borderColor: {
				control: 'color'
			},
			borderWidth: {
				control: 'number'
			},
			label: {
				control: 'text'
			},
			labelColor: {
				control: 'color'
			},
			labelPadding: {
				control: 'number'
			},
			labelPosition: {
				control: 'select',
				options: [
					'topLeft',
					'top',
					'topRight',
					'bottomLeft',
					'bottom',
					'bottomRight',
					'left',
					'center',
					'right'
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
			preserveWhitespace: {
				control: 'boolean'
			}
		},
		args: {
			label: 'Reference Area'
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import LineChart from '$lib/unsorted/viz/line/LineChart.svelte';
	import BarChart from '../../bar/BarChart.svelte';
	import ReferenceArea from './ReferenceArea.svelte';
	import Dropdown from '../../../../../lib/atoms/inputs/dropdown/Dropdown.svelte';
	import DropdownOption from '../../../../../lib/atoms/inputs/dropdown/helpers/DropdownOption.svelte';

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	// From layout.js
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

<Story
	name="Hardcoded: x"
	argTypes={{
		xMin: {
			control: 'number'
		},
		xMax: {
			control: 'number'
		}
	}}
	args={{ xMin: 20, xMax: 40 }}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceArea {...args} />
	</LineChart>
</Story>

<Story
	name="Hardcoded: y"
	argTypes={{
		yMin: {
			control: 'number'
		},
		yMax: {
			control: 'number'
		}
	}}
	args={{ yMin: 450, yMax: 700 }}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceArea {...args} />
	</LineChart>
</Story>

<Story
	name="Hardcoded: x/y"
	argTypes={{
		xMin: {
			control: 'number'
		},
		xMax: {
			control: 'number'
		},
		yMin: {
			control: 'number'
		},
		yMax: {
			control: 'number'
		}
	}}
	args={{ xMin: 20, xMax: 40, yMin: 450, yMax: 700 }}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceArea {...args} />
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
		<ReferenceArea data={referenceAreaData} xMin="xMin" xMax="xMax" label="label" />
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
		<ReferenceArea data={referenceAreaData} yMin="yMin" yMax="yMax" label="label" />
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
		<ReferenceArea
			data={referenceAreaData}
			xMin="xMin"
			xMax="xMax"
			yMin="yMin"
			yMax="yMax"
			label="label"
		/>
	</LineChart>
</Story>

<Story name="Dynamic Data: x w/ dropdown">
	{@const referenceAreaData = Query.create(
		`
      select 30 as xMin, 40 as xMax, 'Area 1' as label union all
      select 50, 60, 'Area 2' union all
      select 70, 80, 'Area 3'
    `,
		query
	)}
	{@const referenceAreaData2 = Query.create(
		`
      select 10 as xMin, 15 as xMax, 'Area 4' as label union all
      select 20, 25, 'Area 5' union all
      select 30, 35, 'Area 6'
    `,
		query
	)}
		<Dropdown name=category1>
			<DropdownOption value="referenceAreaData">referenceAreaData</DropdownOption>
			<DropdownOption value="referenceAreaData2">referenceAreaData2</DropdownOption>
		</Dropdown>
	<LineChart x="x" y="y" {data}>
		<ReferenceArea data={$inputStore['category1']} xMin="xMin" xMax="xMax" label="label" />
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

<Story
	name="Very styled"
	args={{
		xMin: 20,
		xMax: 40,
		areaColor: 'red',
		opacity: 0.2,
		border: true,
		borderType: 'dotted',
		borderColor: 'orange',
		borderWidth: 14,
		labelColor: 'purple',
		labelPadding: 10,
		labelPosition: 'topRight',
		labelBackgroundColor: 'cornflowerblue',
		labelBorderWidth: 12,
		labelBorderRadius: 8,
		labelBorderColor: 'plum',
		labelBorderType: 'dashed',
		fontSize: 18,
		align: 'center',
		bold: true,
		italic: true
	}}
	let:args
>
	<LineChart x="x" y="y" {data}>
		<ReferenceArea {...args} />
	</LineChart>
</Story>

<Story name="Error: Outside of a chart">
	<ReferenceArea label="Reference Area" />
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
		<ReferenceArea data={referenceAreaData} xMin="xMin" xMax="non-existent-column" label="label" />
	</LineChart>
</Story>

<Story name="multiple charts w/ annotations, grid">
	{@const referenceAreaDataLongLoad = Query.create(
		`
      select 30 as xMin, 40 as xMax, 100 as yMin, 150 as yMax, 'Area 1' as label union all
      select 50, 60, 850, 1000, 'Area 2' union all
      select 70, 80, 200, 400, 'Area 3'
    `,
		query
	)}
	<div class="grid grid-cols-4 gap-8">
		<LineChart x="x" y="y" {data}>
			<ReferenceArea
				data={referenceAreaDataLongLoad}
				xMin="xMin"
				xMax="xMax"
				yMin="yMin"
				yMax="yMax"
				label="label"
			/>
		</LineChart>
		<LineChart x="x" y="y" {data}>
			<ReferenceArea
				data={referenceAreaDataLongLoad}
				xMin="xMin"
				xMax="xMax"
				yMin="yMin"
				yMax="yMax"
				label="label"
			/>
		</LineChart>
		<LineChart x="x" y="y" {data}>
			<ReferenceArea
				data={referenceAreaDataLongLoad}
				xMin="xMin"
				xMax="xMax"
				yMin="yMin"
				yMax="yMax"
				label="label"
			/>
		</LineChart>
		<LineChart x="x" y="y" {data}>
			<ReferenceArea
				data={referenceAreaDataLongLoad}
				xMin="xMin"
				xMax="xMax"
				yMin="yMin"
				yMax="yMax"
				label="label"
			/>
		</LineChart>
		<LineChart x="x" y="y" {data}>
			<ReferenceArea
				data={referenceAreaDataLongLoad}
				xMin="xMin"
				xMax="xMax"
				yMin="yMin"
				yMax="yMax"
				label="label"
			/>
		</LineChart>
		<LineChart x="x" y="y" {data}>
			<ReferenceArea
				data={referenceAreaDataLongLoad}
				xMin="xMin"
				xMax="xMax"
				yMin="yMin"
				yMax="yMax"
				label="label"
			/>
		</LineChart>
	</div>
</Story>
