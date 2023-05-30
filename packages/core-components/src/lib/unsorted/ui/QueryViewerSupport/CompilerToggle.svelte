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
		<button class="on">Compiled</button>
		<button on:click={toggleCompiled} class="off">Written</button>
	{:else}
		<button on:click={toggleCompiled} class="off">Compiled</button>
		<button class="on">Written</button>
	{/if}
</div>

<style>
	div.toggle {
		background-color: var(--grey-100);
		border-left: 1px solid var(--grey-200);
		border-right: 1px solid var(--grey-200);
		padding: 10px 0 6px 12px;
		font-family: var(--ui-font-family);
		font-size: 10px;
		font-weight: bold;
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
		font-weight: bold;
	}

	button.off {
		color: var(--grey-600);
		border: 1px solid var(--grey-100);
		transition: all 400ms;
	}

	button.off:hover {
		color: var(--grey-700);
		border: 1px solid var(--grey-300);
		transition: all 400ms;
		background-color: none;
	}

	button.on {
		color: var(--blue-700);
		background-color: var(--blue-100);
		border: 1px solid var(--blue-200);
	}
</style>
