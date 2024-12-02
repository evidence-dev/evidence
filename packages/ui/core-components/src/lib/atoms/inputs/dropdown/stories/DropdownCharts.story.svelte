<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import Dropdown from '../Dropdown.svelte';
	import BarChart from '../../../../unsorted/viz/bar/BarChart.svelte';
	import ECharts from '../../../../unsorted/viz/core/ECharts.svelte';

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputs = getInputContext();

	const dropdownQuery = Query.create(
		`SELECT id as value, tag as label from hashtags ORDER BY 1`,
		query,
		{ disableCache: false }
	);

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	let data;
	const barChartQueryFactory = Query.createReactive({ execFn: query, callback: (v) => (data = v) });
	$: barChartQueryFactory(`
        SELECT COUNT(*) as postCount, tag FROM hashtags
        INNER JOIN post_tags pt on hashtags.id = pt.hashtag_id
        WHERE pt.hashtag_id in ${$inputs?.chartDriver?.value}
        GROUP BY all`);
</script>

<Dropdown data={dropdownQuery} name="chartDriver" label="label" value="value" multiple />

<BarChart {data} title="Posts by Hashtag" y="postCount" x="tag" />

<ECharts
	config={{
		title: {
			text: 'Treemap Example',
			left: 'center'
		},
		tooltip: {
			formatter: '{b}: {c}'
		},
		series: [
			{
				type: 'treemap',
				visibleMin: 300,
				label: {
					show: true,
					formatter: '{b}'
				},
				itemStyle: {
					borderColor: '#fff'
				},
				roam: false,
				nodeClick: false,
				data: data,
				breadcrumb: {
					show: false
				}
			}
		]
	}}
/>

{#each data as d}
	<pre>{JSON.stringify(d, null, 2)}</pre>
{/each}
