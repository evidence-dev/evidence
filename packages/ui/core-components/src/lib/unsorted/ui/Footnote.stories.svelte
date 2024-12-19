<script context="module">
	import Footnote from './Footnote.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Footnote',
		component: Footnote
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
	<Footnote id="1">
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Footnote>
	<Footnote id="2">
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Footnote>
	<Footnote id="3">
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Footnote>
	<BarChart {data} {...args} />
	<Footnote id="1">
		The data for this report was sourced from the World Bank World Development Indicators dataset.
	</Footnote>
	<BarChart {data} {...args} />
</Story>
