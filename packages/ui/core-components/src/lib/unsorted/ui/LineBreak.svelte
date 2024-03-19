<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let lines = 1;
	let items = Array.from({ length: lines });
</script>

{#each items as _ignore}
	<br {_ignore} />
{/each}
