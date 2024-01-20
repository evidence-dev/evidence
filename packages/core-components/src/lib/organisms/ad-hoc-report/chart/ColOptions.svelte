<script>
	/** @type {import("@evidence-dev/query-store").QueryStore} */
	export let query;
</script>

{#each $query.columns as col}
	<option value={col.name}>{col.name} ({col.evidenceType})</option>
{:else}
	<option disabled>No Columns Found</option>
{/each}
