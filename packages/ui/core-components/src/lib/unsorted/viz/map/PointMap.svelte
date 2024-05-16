<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Points from './components/Points.svelte';
	import BaseMap from './BaseMap.svelte';
</script>

<BaseMap>
	<Points {...$$restProps} />
</BaseMap>
