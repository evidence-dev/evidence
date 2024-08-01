<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Points from './Points.svelte';

	/** @type {string|undefined} */
	export let size = undefined; // column containing size data
	/** @type {number} */
	export let opacity = 0.8;
</script>

<Points sizeCol={size} {opacity} {...$$restProps} />
