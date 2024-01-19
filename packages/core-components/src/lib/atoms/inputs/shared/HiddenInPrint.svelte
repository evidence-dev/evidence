<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let enabled = true;

	let printing = false;
</script>

<svelte:window
	on:beforeprint={() => (printing = true)}
	on:afterprint={() => (printing = false)}
	on:export-beforeprint={() => (printing = true)}
	on:export-afterprint={() => (printing = false)}
/>

{#if !(enabled && printing)}<slot />{/if}
