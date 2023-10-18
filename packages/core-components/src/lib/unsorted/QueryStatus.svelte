<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { toasts } from './ui/ToastWrapper.svelte';
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
				await invalidateAll();
			}

			const { status, id } = data;

			const style =
				status === 'running'
					? 'border border-gray-400 bg-white text-gray-800'
					: status === 'error'
					? 'border-red-200 border bg-red-50 text-red-800 transition-all duration-300'
					: status === 'done'
					? 'border-green-400 border bg-green-100 text-green-900 transition-all duration-300'
					: '';

			const message =
				status === 'running'
					? 'Rebuilding'
					: status === 'error'
					? 'Error while rebuilding'
					: status === 'done'
					? 'Rebuilt'
					: '';

			const title = id.endsWith('.connection') ? id.split('.')[0] : id;

			const unique_id = Math.random();
			const status_as_toast = {
				title,
				message,
				style,
				id: unique_id
			};

			toasts.update(($toasts) => ($toasts.push(status_as_toast), $toasts));
			setTimeout(() => {
				toasts.update(($toasts) => $toasts.filter((toast) => toast.id !== unique_id));
			}, 5000);
		});
	}
</script>
