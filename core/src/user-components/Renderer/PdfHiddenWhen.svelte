<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getRepeatIterationChain } from '../tags/repeat/repeat-iteration-context';
	import { encodeIterationChain } from '../../print-outline/section-key';

	type Props = {
		/** Encoded iteration chains in which this content is hidden. */
		chains: string[];
		children: Snippet;
	};

	let { chains, children }: Props = $props();

	const current = encodeIterationChain(getRepeatIterationChain());
	const hidden = $derived(chains.includes(current));
</script>

{#if hidden}
	<div class="contents" data-pdf-hidden>
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
