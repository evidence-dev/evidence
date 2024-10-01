<script>
	import { dev } from '$app/environment';

	// This wrapper is used to prevent devtools from escaping dev mode
</script>

{#if dev}
	{#await import(/* @vite-ignore */ "./_DevTools.svelte")}
		<slot />
	{:then DevTools}
		<svelte:component this={DevTools}>
			<slot />
		</svelte:component>
	{/await}
{:else}
	<slot />
{/if}
