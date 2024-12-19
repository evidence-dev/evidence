<script>
	import evidenceLogoWhite from './wordmark-white.png';
	import evidenceLogoBlack from './wordmark-black.png';

	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';

	/** @type {string | undefined} */
	export let logo;

	/** @type {string | undefined} */
	export let lightLogo;

	/** @type {string | undefined} */
	export let darkLogo;

	export let title;
</script>

{#if title}
	{title}
{:else}
	<img
		src={logo ?? lightLogo ?? evidenceLogoBlack}
		alt="Home"
		class="h-5 aspect-auto block dark:hidden"
		href={addBasePath('/')}
	/>
	<img
		src={logo ?? darkLogo ?? evidenceLogoWhite}
		alt="Home"
		class="h-5 aspect-auto hidden dark:block"
		href={addBasePath('/')}
	/>
{/if}
