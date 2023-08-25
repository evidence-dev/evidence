<script>
	import { building } from '$app/environment';

	/** @type {Record<string, unknown>[]} */
	export let data;
	/** @type {string}*/
	export let link;
</script>

{#if building}
	{#each Array.from(new Set(data.map((row) => row[link]))) as href}
		<a {href} class="hidden" aria-hidden="true">{''}</a>
	{/each}
{/if}
