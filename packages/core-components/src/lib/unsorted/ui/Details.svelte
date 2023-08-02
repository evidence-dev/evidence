<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let title = 'Details';
	export let open = false;
	import { slide } from 'svelte/transition';
</script>

<div class="mb-4 mt-3 ml-1">
	<button class="italic text-base text-grey-800 cursor-pointer" on:click={() => (open = !open)}>
		<span class={open ? 'marker rotate-marker' : 'marker'} />
		{title}
	</button>

	{#if open}
		<div class="ml-3 pt-3 mb-6 text-base" transition:slide>
			<slot />
		</div>
	{/if}
</div>

<style>
	.marker {
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 9px solid var(--grey-800);
		margin-right: 8px;
		transform: rotate(-90deg);
		transition: transform 0.2s ease;
	}

	.rotate-marker {
		transform: rotate(0deg);
	}

	button {
		display: flex;
		align-items: center;
		cursor: pointer;
	}
</style>
