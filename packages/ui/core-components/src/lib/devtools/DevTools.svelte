<script>
	import { dev } from '$app/environment';
</script>

{#if dev}
	{#await import('./_DevTools.svelte')}
	{:then DevTools}
		<svelte:component this={DevTools.default}>
			<slot />
		</svelte:component>
	{/await}
{:else}
	<slot />
{/if}
