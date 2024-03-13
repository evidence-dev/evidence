<script>
	import defaultLogo from './wordmark-gray-800.png';
	export let logo;
	export let title;
</script>

{#if logo}
	<img src={logo} alt="logo" class="h-5 aspect-auto" href="/" />
{:else if title}
	{title}
{:else}
	<img src={defaultLogo} alt="evidence" class="h-5 aspect-auto" href="/" />
{/if}
