<script>
	import { browser } from '$app/environment';
	import { getContext } from 'svelte';
	import { SqlConsole } from '../../../molecules/sql-console';

	/** @type {import("../blocks").Query} */
	export let block;

	const readonly = getContext('__adhoc_readonly');
</script>

<div class="relative">
	<SqlConsole
		showResults={false}
		hideErrors={!browser}
		bind:data={block.data}
		initialQuery={block.content}
		showControls={!readonly}
	/>
	<!-- Can we get the query text -->
	<!-- {block.content}
	{block.data?.originalText} -->
</div>
