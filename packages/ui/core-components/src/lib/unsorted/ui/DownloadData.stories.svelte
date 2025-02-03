<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/DownloadData'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import DownloadData from './DownloadData.svelte';

	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { Query } from '@evidence-dev/sdk/usql';

	const data = Query.create(`SELECT * from flights LIMIT 1000`, query);
</script>

<Story name="Base">
	<DownloadData {data} />
</Story>
<Story name="Error">
	<DownloadData data={undefined} />
	<DownloadData data="string" />
</Story>
