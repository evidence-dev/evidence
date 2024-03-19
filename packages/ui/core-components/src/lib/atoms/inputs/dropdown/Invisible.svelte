<script context="module">
	import { getContext, setContext } from 'svelte';

	export const isInvisible = () => getContext('__evidence_isInvisible');
	const setInvisible = () => setContext('__evidence_isInvisible', true);
</script>

<script>
	setInvisible();
</script>

<template class="hidden">
	<slot />
</template>
