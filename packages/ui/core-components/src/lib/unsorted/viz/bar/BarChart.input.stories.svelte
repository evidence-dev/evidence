<script context="module">
	import BarChart from './BarChart.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Charts/BarCharts/As Input',
		component: BarChart
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { Query } from '@evidence-dev/sdk/usql';
	import DataTable from '../table/DataTable.svelte';

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputs = getInputContext();
</script>





<Story name="Simple Input" let:args>
	{@const data = Query.create(
		`
SELECT COUNT(distinct posts.id) as "Post Count", COUNT(distinct posts.user_id) as "Author Count", tag as hashtag
FROM posts
		INNER JOIN post_tags pt ON pt.post_id = posts.id
		INNER JOIN hashtags h ON h.id = pt.hashtag_id
GROUP BY ALL
`,
		query
	)}

	<BarChart {...args} name="posts_by_tag" targetColumn="tag" toggle x="hashtag" y="Post Count" {data} />

	{@const depends = Query.create(
		`
		SELECT 
			tag, 
			gender, 
			COUNT(distinct p.id) as "Post Count", 
			COUNT(distinct u.id) as "Author Count"
		FROM hashtags h
		INNER JOIN post_tags pt ON pt.hashtag_id = h.id
		INNER JOIN posts p ON p.id = pt.post_id
		INNER JOIN users u ON u.id = p.user_id
		WHERE ${$inputs.posts_by_tag}
		GROUP BY ALL
		`,
		query
	)}

	<pre class='text-xs'>{depends.originalText}</pre>

	{$inputs.tag.label.toString() || 'All'} Post and Authors by Gender
	<DataTable data={depends} />
</Story>

















<Story name="Input with Series" let:args>
	{@const data = Query.create(
		`
SELECT COUNT(distinct posts.id) as "Post Count", COUNT(distinct posts.user_id) as "Author Count", tag as hashtag, gender
FROM posts
		INNER JOIN post_tags pt ON pt.post_id = posts.id
		INNER JOIN hashtags h ON h.id = pt.hashtag_id
        INNER JOIN users u ON u.id = posts.user_id
GROUP BY ALL
`,
		query
	)}

	<BarChart {...args} 
		toggle 
		name="posts_by_tag_and_gender" 

		targetColumn="tag"
		targetSeriesColumn="gender" 
		
		x="hashtag" 
		y="Post Count" 
		series="gender" 
		{data} 
	/>

	{@const depends = Query.create(
		`
		SELECT 
			tag, 
			gender, 
			COUNT(distinct p.id) as "Post Count", 
			COUNT(distinct u.id) as "Author Count"
		FROM hashtags h
		INNER JOIN post_tags pt ON pt.hashtag_id = h.id
		INNER JOIN posts p ON p.id = pt.post_id
		INNER JOIN users u ON u.id = p.user_id
		WHERE ${$inputs.posts_by_tag_and_gender}
		GROUP BY ALL
		`,
		query
	)}

	{$inputs.tag.label.toString() || 'All'} Post and Authors by Gender
	<DataTable data={depends} />
</Story>
