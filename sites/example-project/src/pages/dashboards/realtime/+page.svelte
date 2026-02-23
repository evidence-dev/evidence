<script>
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	let clientNow = new Date();
	let hydratedAt = '';

	onMount(() => {
		hydratedAt = new Date().toISOString();
		const timer = setInterval(() => {
			clientNow = new Date();
		}, 1000);
		return () => clearInterval(timer);
	});
</script>

<h1 class="markdown">Realtime Dashboard (Runtime SSR + CSR)</h1>
<p class="markdown">
	This page is rendered on the server for each request and then hydrated in the browser.
</p>

<ul class="markdown">
	<li><b>Route:</b> <code>{data.pathname}</code></li>
	<li><b>Server rendered at:</b> <code>{data.serverRenderedAt}</code></li>
	<li><b>Client hydrated at:</b> <code>{hydratedAt || 'hydrating...'}</code></li>
	<li><b>Client clock (updates every second):</b> <code>{clientNow.toISOString()}</code></li>
</ul>

