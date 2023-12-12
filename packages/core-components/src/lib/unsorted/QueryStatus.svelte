<script>
	import { toasts } from '@evidence-dev/component-utilities/stores';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { QueryStore } from '@evidence-dev/query-store';
	import { onMount, onDestroy } from 'svelte';

	/**
	 * @param {any} data
	 */
	const handleStatusEvent = async (data) => {
		if (data.status === 'done') {
			await $page.data.__db.updateParquetURLs(data.manifest, true);

			QueryStore.emptyCache();
			// clear the cached data
			for (const key in $page.data.data) {
				delete $page.data.data[key];
			}

			await invalidateAll();
		}

		const { status, id } = data;

		const style =
			status === 'running'
				? 'info'
				: status === 'error'
				? 'error'
				: status === 'done'
				? 'success'
				: '';

		const message =
			status === 'running'
				? 'Rebuilding'
				: status === 'error'
				? 'Error while rebuilding'
				: status === 'done'
				? 'Rebuilt'
				: '';

		// if the connection.yaml was rebuilt, the id will be something like
		// needful_things.connection (the .yaml is stripped off)
		const title = id.endsWith('.connection') ? id.split('.')[0] : id;

		const unique_id = Math.random();
		const status_as_toast = {
			title,
			message,
			status: style,
			id: unique_id,
			dismissable: true
		};

		toasts.add(status_as_toast, 0);
	};

	onMount(() => {
		if (!browser) return;
		if (!import.meta.hot) return;
		import.meta.hot.on('evidence:build-status', handleStatusEvent);
	});

	onDestroy(() => {
		if (!browser) return;
		if (!import.meta.hot) return;
		import.meta.hot.off('evidence:build-status', handleStatusEvent);
	});
</script>
