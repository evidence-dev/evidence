<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let value;

	import { afterUpdate } from 'svelte';

	let flash = true;
	afterUpdate(() => {
		flash = !flash;
	});
</script>

<span class={flash ? 'flash' : 'normal'}>{value}</span>

<style>
	span.normal {
		transition: all 1s;
	}
	span.flash {
		color: var(--blue-600);
	}
</style>
