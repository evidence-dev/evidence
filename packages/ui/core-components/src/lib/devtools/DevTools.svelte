<script>
	import { building, dev } from '$app/environment';
	import DevTools from './_DevTools.svelte';

    // This wrapper is used to prevent devtools from escaping dev mode
</script>

{#if building}
	<slot />
{:else if dev}
	<DevTools>
		<slot />
	</DevTools>
{/if}
