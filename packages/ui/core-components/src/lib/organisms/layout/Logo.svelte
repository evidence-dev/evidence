<script>
	import evidenceLogoWhite from './wordmark-white.png';
	import evidenceLogoBlack from './wordmark-black.png';

	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let logo;
	export let title;
</script>

{#if logo}
	<img src={logo} alt="Home" class="h-5 aspect-auto" href={addBasePath('/')} />
{:else if title}
	{title}
{:else}
	<img
		src={evidenceLogoBlack}
		alt="Home"
		class="h-5 aspect-auto block dark:hidden"
		href={addBasePath('/')}
	/>
	<img
		src={evidenceLogoWhite}
		alt="Home"
		class="h-5 aspect-auto hidden dark:block"
		href={addBasePath('/')}
	/>
{/if}
