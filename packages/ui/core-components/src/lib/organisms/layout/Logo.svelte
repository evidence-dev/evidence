<script>
	import defaultLogo from './wordmark-gray-800.png';
	import { buildUrl } from '@evidence-dev/sdk/utils/svelte';
	export let logo;
	export let title;
</script>

{#if logo}
	<img src={logo} alt="logo" class="h-5 aspect-auto" href={buildUrl("/")} />
{:else if title}
	{title}
{:else}
	<img src={defaultLogo} alt="evidence" class="h-5 aspect-auto" href={buildUrl("/")} />
{/if}
