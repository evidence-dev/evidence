<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'viz/references/ReferenceLine',
		component: ReferenceLine
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import LineChart from '$lib/unsorted/viz/line/LineChart.svelte';
	import { Slider } from '$lib/atoms/inputs/slider';
	import { userEvent, within } from '@storybook/test';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';

	import ReferenceLine from './ReferenceLine.svelte';

	const inputStore = getInputContext();

	const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query);
</script>

<Story name="Basic Usage">
	<LineChart x="x" y="y" {data}>
		<ReferenceLine x={50} label="Reference Line" />
	</LineChart>
</Story>

<Story
	name="Dynamic X value"
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
