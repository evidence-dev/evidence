<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { toasts } from '@evidence-dev/component-utilities/stores';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';

	if (browser && import.meta.hot) {
		import.meta.hot.on('evidence:build-status', async (data) => {
			if (data.status === 'done') {
				// i don't know why this is necessary
				// possibly because static files take a bit for the dev server
				// to realize they exist?
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await $page.data.__db.updateParquetURLs(data.manifest);

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
				id: unique_id
			};

			toasts.add(status_as_toast, 5000);
		});
	}
</script>
