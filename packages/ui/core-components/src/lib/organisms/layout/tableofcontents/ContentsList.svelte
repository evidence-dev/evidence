<script>
	import { onMount, onDestroy } from 'svelte';

	let headers = [];
	let observer;

	function updateLinks() {
		headers = Array.from(document.querySelectorAll('h1.markdown, h2.markdown, h3.markdown'));
	}

	function observeDocumentChanges() {
		observer = new MutationObserver(() => {
			updateLinks();
		});

		headers.forEach((header) => {
			observer.observe(header, { subtree: true, characterData: true, childList: true });
		});

		return observer;
	}

	onMount(() => {
		updateLinks();
		observer = observeDocumentChanges();
	});

	onDestroy(() => {
		observer?.disconnect();
	});
</script>

{#if headers && headers.length > 1}
	<span class="block text-xs sticky top-0 mb-2 text-gray-950 bg-white shadow-white font-medium">
		On this page
	</span>
	{#each headers as header}
		<a href="#{header.id}" class={header.nodeName.toLowerCase()}>
			{header.innerText}
		</a>
	{/each}
{/if}

<style>
	a {
		@apply block text-gray-600 text-xs transition-all duration-200 py-1;
	}

	a:hover {
		@apply underline;
	}

	a.h2 {
		@apply pl-0 text-gray-500;
	}

	a.h3 {
		@apply pl-4 text-gray-500;
	}

	a.h1 {
		@apply mt-3 font-semibold block bg-white shadow shadow-white;
	}
</style>
