<script>
	import lightLogo from './wordmark-light.png';
	import darkLogo from './wordmark-dark.png';

	export let logo;
	export let title;
</script>

{#if logo}
	<img src={logo} alt="logo" class="h-5 aspect-auto" href="/" />
{:else if title}
	{title}
{:else}
	<img src={lightLogo} alt="evidence" class="h-5 aspect-auto dark:hidden block" href="/" />
	<img src={darkLogo} alt="evidence" class="h-5 aspect-auto dark:block hidden" href="/" />

{/if}
