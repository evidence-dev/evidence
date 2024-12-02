<script>
	import { dev } from '$app/environment';
	import DevTools from './_DevTools.svelte';

	// This wrapper is used to prevent devtools from escaping dev mode
</script>

{#if dev}
	<DevTools>
		<slot />
	</DevTools>
{:else}
	<slot />
{/if}
