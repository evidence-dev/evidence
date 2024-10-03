<script>
	import evidenceLogoWhite from './wordmark-white.png';
	import evidenceLogoBlack from './wordmark-black.png';

	export let logo;
	export let title;
</script>

{#if logo}
	<img src={logo} alt="logo" class="h-5 aspect-auto" href="/" />
{:else if title}
	{title}
{:else}
	<img src={evidenceLogoBlack} alt="evidence" class="h-5 aspect-auto block dark:hidden" href="/" />
	<img src={evidenceLogoWhite} alt="evidence" class="h-5 aspect-auto hidden dark:block" href="/" />
{/if}
