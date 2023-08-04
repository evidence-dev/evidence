<script>
	import { onMount } from 'svelte';
	let headers;
	onMount(() => {
		headers = document.querySelectorAll('h1.markdown, h2.markdown');
		// Add ID tags to all the headers in the article
		headers.forEach((header, i) => {
			header.id = encodeURIComponent(header.innerText + i);
		});
	});
</script>

{#if headers && headers.length > 1}
	<span class="block text-xs sticky top-0 mb-2 text-gray-950 bg-white shadow-white font-medium">
		On this page
	</span>
	{#each headers as header, i}
		<a
			href={'#' + encodeURIComponent(header.innerText + i)}
			class={header.nodeName.toLowerCase()}
			class:first={i === 0}
		>
			{header.innerText}
		</a>
	{/each}
{/if}

<style>
	a {
		@apply block text-gray-600 text-xs transition-all duration-200 py-1;
	}

	/* a.h1.first {
		@apply mt-0;
	} */

	a:hover {
		@apply underline;
	}

	a.h2 {
		@apply pl-0 text-gray-500;
	}

	a.h1 {
		@apply mt-3 font-semibold block bg-white shadow shadow-white;
	}
</style>
