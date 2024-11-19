<script context="module">
	import Delta from './Delta.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Delta',
		component: Delta
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const data = Query.create(`select 0.366 as positive, 0 as neutral, -0.366 as negative`, query);
</script>

<Story name="All" let:args>
	<Delta {...args} {data} column="positive" fmt="pct1" />
	<br />
	<Delta {...args} {data} column="neutral" fmt="pct1" />
	<br />
	<Delta {...args} {data} column="negative" fmt="pct1" />
	<br />
	<Delta {...args} {data} column="positive" fmt="pct1" chip />
	<br />
	<Delta {...args} {data} column="neutral" fmt="pct1" chip />
	<br />
	<Delta {...args} {data} column="negative" fmt="pct1" chip />
	<br />
</Story>
