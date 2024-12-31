<script context="module">
	import Note from './Note.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Note',
		component: Note
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	import BarChart from '../viz/bar/BarChart.svelte';
</script>

<Story name="All" args={{ x: 'x', y: 'y', series: 'series' }} let:args>
	{@const data = Query.create(`select * from numeric_series`, query)}
	<Note>
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Note>
	<Note>
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Note>
	<Note>
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Note>
	<BarChart {data} {...args} />
	<Note>
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Note>
	<BarChart {data} {...args} />
</Story>
