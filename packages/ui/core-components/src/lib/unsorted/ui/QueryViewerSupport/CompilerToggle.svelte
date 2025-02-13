<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { slide } from 'svelte/transition';

	export let showCompiled;

	const toggleCompiled = function () {
		showCompiled = !showCompiled;
	};
</script>

<div class="toggle" transition:slide|local>
	{#if showCompiled}
		<button class="text-info bg-info/10 border border-info">Compiled</button>
		<button on:click={toggleCompiled} class="off">Written</button>
	{:else}
		<button on:click={toggleCompiled} class="off">Compiled</button>
		<button class="text-info bg-info/10 border border-info">Written</button>
	{/if}
</div>

<style>
	div.toggle {
		background-color: var(--base-200);
		border-left: 1px solid var(--base-300);
		border-right: 1px solid var(--base-300);
		padding: 6px 0 10px 12px;
		font-family: var(--ui-font-family);
		font-size: 10px;
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
	}

	button {
		padding: 2px 4px 2px 4px;
		border-radius: 3px;
		cursor: pointer;
		background-color: transparent;
		font-size: 1em;
		font-weight: 600;
	}

	button.off {
		border: 1px solid var(--base-300);
		transition: all 400ms;
	}

	button.off:hover {
		background-color: var(--base-300);
		transition: all 400ms;
	}
</style>
