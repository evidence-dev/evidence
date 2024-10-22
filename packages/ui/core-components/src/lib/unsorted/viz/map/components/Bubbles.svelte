<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Points from './Points.svelte';

	/** @type {string|undefined} */
	export let size = undefined; // column containing size data
	/** @type {number} */
	export let opacity = 0.8;
	/** @type {'bubble' | 'points' }*/
	export let pointStyle = 'bubbles';
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;
</script>

<Points sizeCol={size} {opacity} {pointStyle} {legendType} {...$$restProps} />
