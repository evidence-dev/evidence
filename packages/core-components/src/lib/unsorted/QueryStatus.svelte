<script context="module">
	let currentHandler = () => {};

	if (browser && import.meta.hot) {
		import.meta.hot.on('evidence:build-status', (data) => {
			if (data) currentHandler(data);
		});
	}
</script>

<script>
	import { toasts } from '@evidence-dev/component-utilities/stores';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { QueryStore } from '@evidence-dev/query-store';
	import { onMount } from 'svelte';

	/**
	 * @param {any} data
	 */
	const handleStatusEvent = async (data) => {
		toasts.add(data.toast, 5000);

		if (data.done) {
			await $page.data.__db.updateParquetURLs(data.manifest, true);

			QueryStore.emptyCache();
			// clear the cached data
			for (const key in $page.data.data) {
				delete $page.data.data[key];
			}

			console.log({ p: $page.data });

			await invalidateAll();
		}
	};

	onMount(() => {
		currentHandler = handleStatusEvent;
	});
</script>
