<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Bubbles from './components/Bubbles.svelte';
	import BaseMap from './BaseMap.svelte';
</script>

<BaseMap>
	<Bubbles {...$$restProps} />
</BaseMap>
