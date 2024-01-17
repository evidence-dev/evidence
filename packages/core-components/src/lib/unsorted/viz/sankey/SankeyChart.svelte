<!-- kept backwards compatability -->
<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import SankeyDiagram from './SankeyDiagram.svelte';
</script>

<SankeyDiagram {...$$props} />
