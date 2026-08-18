<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setCardContext } from './card-context.svelte';

	let { children }: { children: Snippet } = $props();

	setCardContext({ insideCard: true });
</script>

{@render children()}
