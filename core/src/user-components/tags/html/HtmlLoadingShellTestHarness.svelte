<script lang="ts">
	import HtmlLoadingShell from './HtmlLoadingShell.svelte';

	type Props = {
		fallbackMs: number;
	};
	let { fallbackMs }: Props = $props();
	let resetKey = $state('a');
</script>

<button type="button" data-testid="bump-reset" onclick={() => (resetKey += 'x')}>bump</button>

<HtmlLoadingShell {fallbackMs} {resetKey}>
	{#snippet children({ onRendered })}
		<button type="button" data-testid="mark-ready" onclick={onRendered}>content</button>
	{/snippet}
</HtmlLoadingShell>
