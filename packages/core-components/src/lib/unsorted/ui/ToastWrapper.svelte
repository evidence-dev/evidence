<script context="module">
	import { writable } from 'svelte/store';
	import Toast from './Toast.svelte';

	export const toasts = writable([]);
</script>

<div class="container">
	{#each $toasts as toast (toast.id)}
		<Toast {...toast} />
	{/each}
</div>

<style>
	div.container {
		z-index: 1;
		position: fixed;
		right: 0;
		bottom: 0;
		margin: 1.5em 2.5em;
		width: 20em;
	}
</style>
