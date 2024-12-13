<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let title = 'Details';
	export let open = false;
	$: open = open === 'true' || open === true;
	import { slide } from 'svelte/transition';
</script>

<div class="mb-4 mt-3">
	<button class="text-sm cursor-pointer inline-flex gap-2" on:click={() => (open = !open)}>
		<span class={open ? 'marker rotate-marker' : 'marker'} />
		<span> {title} </span>
	</button>

	{#if open}
		<div class="pl-[calc(0.5rem+10px)] pt-3 mb-6" transition:slide|local>
			<slot />
		</div>
	{/if}
</div>

<style>
	.marker {
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 9px solid var(--base-content-muted);
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
