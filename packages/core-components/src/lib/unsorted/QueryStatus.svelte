<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onDestroy } from 'svelte';
	import QueryToast from './ui/QueryToast.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';

	let statuses = [];
	if (browser) {
		const source = new EventSource('/api/status');
		source.addEventListener('message', async (event) => {
			const data = JSON.parse(event.data);
			if (data.status === 'done') {
				// i don't know why this is necessary
				// possibly because static files take a bit for the dev server
				// to realize they exist?
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await $page.data.__db.updateParquetURLs(data.manifest);
				await invalidateAll();
			}

			statuses.push(data);
			statuses = statuses;
			// remove status toast after 5 seconds
			// should probably go in QueryToast
			setTimeout(() => statuses.splice(statuses.indexOf(data), 1), 5000);
		});

		onDestroy(() => {
			source.close();
		});
	}
</script>

<div class="container">
	{#each statuses as status}
		<QueryToast {status} />
	{/each}
</div>

<style>
	div.container {
		z-index: 1;
		position: fixed;
		right: 0;
		bottom: 0;
		margin: 1.5em 2.5em;
		width: 20em;
	}
</style>
