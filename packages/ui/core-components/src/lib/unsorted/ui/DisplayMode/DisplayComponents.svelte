<script context="module">
	export const evidenceInclude = true;
</script>
 
<script>
    import Grid from "$lib/atoms/grid/Grid.svelte";
</script>

<Grid cols={2}>
    <slot />
</Grid>