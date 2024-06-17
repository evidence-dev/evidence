<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<!-- Add a carot similar to accordion (also, just use accordion?) -->

<button on:click={() => dispatch('select', query)} class="w-full text-left px-2 py-1">
	ID: {query.id} - Hash: {query.hash}
</button>
