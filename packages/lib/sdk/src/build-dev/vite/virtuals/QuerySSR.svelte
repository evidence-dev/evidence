<script>
	/** @type {import("@evidence-dev/sdk/query-store").Query[]} */
	export let queries = [];
</script>

<svelte:head>
	{#each queries as query}
		<meta
			evidence-query-presence={btoa(query.originalText)}
			evidence-query-content={query.originalText}
		/>
	{/each}
</svelte:head>
