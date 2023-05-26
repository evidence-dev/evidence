<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount } from 'svelte';
	let headers;
	onMount(() => {
		headers = document.querySelector('article').querySelectorAll('h1, h2');
		// Add ID tags to all the headers in the article
		headers.forEach((header, i) => {
			header.id = encodeURIComponent(header.innerText + i);
		});
	});
</script>

{#if headers && headers.length > 1}
	{#each headers as header, i}
		<a
			href={'#' + encodeURIComponent(header.innerText + i)}
			class={header.nodeName == 'H1' ? 'h1' : 'h2'}
		>
			{header.innerText}
		</a>
	{/each}
{/if}

<style>
	a {
		display: block;
		padding-block-end: 0.6em;
		padding-block-start: 0em;
		font-size: 0.7em;
		text-decoration: none;
		color: var(--grey-800);
		transition-property: border color;
		transition-duration: 600ms;
		font-family: var(--ui-font-family-compact);
	}

	a:hover {
		color: var(--blue-600);
		transition-property: color border;
		transition-duration: 600ms;
	}

	a.h2 {
		/* margin-left: 0.1em; */
		padding-left: 0.8em;
		border-left: 1px solid var(--grey-200);
	}

	a.h2:hover {
		border-left: 1px solid var(--blue-200);
	}

	a.h1 {
		margin-block-start: 0.6em;
	}
</style>
