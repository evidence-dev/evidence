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
			x: {
				control: 'number'
			},
			y: {
				control: 'number'
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
			color: {
				control: 'color'
			},
			labelColor: {
				control: 'color'
			},
			symbolColor: {
				control: 'color'
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
			}
		},
		args: {
			x: 24,
			y: 500
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

	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);

	const data = Query.create(`SELECT * FROM numeric_series WHERE series='pink'`, query);
</script>

<Story name="Basic Usage" let:args>
	<LineChart x="x" y="y" {data}>
		<ReferencePoint {...args} />
	</LineChart>
</Story>
