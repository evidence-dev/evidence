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
	<span class="block text-xs sticky top-0 mb-2 bg-base-100 shadow-base-100 font-medium">
		On this page
	</span>
	{#each headers as header}
		<a href="#{header.id}" class={header.nodeName.toLowerCase()}>
			{header.innerText}
		</a>
	{/each}
{/if}

<style lang="postcss">
	a {
		@apply block text-xs transition-all duration-200 py-1;
	}

	a:hover {
		@apply underline;
	}

	a.h1 {
		@apply mt-3 font-semibold block bg-base-100 shadow shadow-base-100;
	}

	a.h2 {
		@apply pl-0 text-base-content-muted;
	}

	a.h3 {
		@apply pl-4 text-base-content-muted;
	}
</style>
