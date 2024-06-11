<script context="module">
	let currentHandler = () => {};
	/** @param { import("@evidence-dev/component-utilities/stores").Toast } toast */
	let notify = () => {};

	if (browser && import.meta.hot) {
		import.meta.hot.on('evidence:source-start', (data) => {
			if (data) {
				notify(data.toast);
			} else console.warn(`evidence:source-start dispatched without payload`);
		});
		import.meta.hot.on('evidence:source-end', (data) => {
			if (data) {
				notify(data.toast);
			} else console.warn(`evidence:source-end dispatched without payload`);
		});
		import.meta.hot.on('evidence:source-error', (data) => {
			console.error(data.error);
			if (data.toast) notify(data.toast);
		});
	}
</script>

<script>
	import { toasts } from '@evidence-dev/component-utilities/stores';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { Query } from '@evidence-dev/sdk/usql';
	import { onMount } from 'svelte';

	/**
	 * @param {any} data
	 */
	const handleStatusEvent = async (data) => {
		await $page.data.__db.updateParquetURLs(JSON.stringify(data.manifest), true);

		Query.emptyCache();
		// clear the cached data
		for (const key in $page.data.data) {
			delete $page.data.data[key];
		}

		await invalidateAll();
		console.log('Did it!');
	};

	onMount(() => {
		currentHandler = handleStatusEvent;
		notify = (toast) => toasts.add(toast, 5000);
	});
</script>
