<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const activeItem = writable(-1);

	function setActiveItem(index) {
		activeItem.update((current) => (current === index ? -1 : index));
	}

	setContext('accordion', { setActiveItem, activeItem });
</script>

<div class="my-6 divide-y rounded border border-neutral-200 min-w-full">
	<slot />
</div>
