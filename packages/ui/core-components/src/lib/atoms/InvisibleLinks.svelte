<script>
	import { building } from '$app/environment';
	import { buildUrl } from '@evidence-dev/sdk/utils/svelte';

	/** @type {Record<string, unknown>[]} */
	export let data;
	/** @type {string}*/
	export let link;
</script>

<!-- we only care about links being crawled during build time -->
{#if building}
	{#each Array.from(new Set(data.map((row) => row[link]))) as href}
		<a href={buildUrl(href)} class="hidden" aria-hidden="true">{''}</a>
	{/each}
{/if}
