<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { slide } from 'svelte/transition';
	import { toBoolean } from '../../utils.js';

	export let title = 'Details';
	export let open = false;
	$: open = toBoolean(open);

	export let printShowAll = true;
	$: printShowAll = toBoolean(printShowAll);
	let printing = false;
</script>

<svelte:window
	on:beforeprint={() => (printing = true)}
	on:afterprint={() => (printing = false)}
	on:export-beforeprint={() => (printing = true)}
	on:export-afterprint={() => (printing = false)}
/>

{#if !printing || !printShowAll}
	<div class="mb-4 mt-2">
		<button
			class="text-sm text-base-content-muted cursor-pointer inline-flex gap-2"
			on:click={() => (open = !open)}
		>
			<span class={open ? 'marker rotate-marker' : 'marker'} />
			<span> {title} </span>
		</button>

		{#if open}
			<div class="pl-[calc(0.5rem+10px)] pt-3 mb-6 text-sm" transition:slide|local>
				<slot />
			</div>
		{/if}
	</div>
{:else}
	<div class="mb-4 mt-2 text-base-content-muted">
		<span class="text-sm font-semibold inline-flex"> {title} </span>

		<div class="pt-1 mb-6 text-sm">
			<slot />
		</div>
	</div>
{/if}

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
