<script>
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import QueryToast from './ui/QueryToast.svelte';
	import { delay } from '$lib/delay';
	import { routeHash } from './ui/stores';
	import { base } from '$app/paths';
	export let endpoint = '';

	let statuses = [];
	let previousStatuses = [];
	$: activeStatuses = statuses.filter((d) => d.status != 'not run' && d.status != 'from cache');

	async function getStatus() {
		if (endpoint == '') {
			return [];
		}

		let statusEndpoint = `${base}/api/status${$page.route.id}`.replace(/\/$/, '');
		const res = await fetch(statusEndpoint);
		const { status } = await res.json();

		if (res.ok) {
			return status;
		} else {
			throw new Error(status);
		}
	}

	async function checkStatusAndInvalidate() {
		statuses = await getStatus();
		// previous not empty check prevents executing the same query multi-times on startup
		// Check if queries have been removed from the page entirely, it allows vite/compile error to get to the page
		if (previousStatuses.length !== 0 && statuses.length != previousStatuses.length) {
			await invalidate((url) => url.pathname === `/api/${endpoint}.json`);
		}
		if (statuses.length > 0) {
			for (let i = 0; i < statuses.length; i++) {
				const query = statuses[i];
				if (query.status === 'not run') {
					// force svelte load on API endpoint & front-end page
					await invalidate((url) => url.pathname === `/api/${endpoint}.json`);
					await invalidate((url) => url.pathname === window.location.pathname);
					await delay(1000);
				}
			}
			activeStatuses.push(...statuses);
		}

		previousStatuses = statuses;
	}

	onMount(() => {
		endpoint = $routeHash;
		const interval = setInterval(() => {
			checkStatusAndInvalidate();
		}, 100);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="container">
	{#each activeStatuses as status}
		<QueryToast bind:status />
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
