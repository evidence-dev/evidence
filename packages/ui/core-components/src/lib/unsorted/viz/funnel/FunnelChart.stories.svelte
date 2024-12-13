<script context="module">
	import FunnelChart from './FunnelChart.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/FunnelChart',
		component: FunnelChart
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const data = Query.create(
		`
			select * from (
				select 150 as customers, 'Show' as stage, 1 as stage_id
				union all
				select 102 as customers, 'Click' as stage, 2 as stage_id
				union all
				select 49 as customers, 'Visit' as stage, 3 as stage_id
				union all
				select 40 as customers, 'Inquiry' as stage, 4 as stage_id
				union all
				select 14 as customers, 'Order' as stage, 5 as stage_id
			) order by stage_id asc
	`,
		query
	);
</script>

<Story name="FunnelChart" id="funnelchart" let:args>
	<FunnelChart {...args} {data} nameCol="stage" valueCol="customers" />
</Story>
