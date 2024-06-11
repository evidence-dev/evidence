<script context="module">
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
	import { onMount } from 'svelte';

	onMount(() => {
		notify = (toast) => toasts.add(toast, 5000);
	});
</script>
