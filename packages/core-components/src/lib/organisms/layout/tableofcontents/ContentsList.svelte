<script>
	import { onMount, onDestroy } from 'svelte';

	let headers = [];
	let observer;

	function slugify(text){
		return text.toString().toLowerCase()
			.replace(/\s+/g, '-')           // Replace spaces with -
			.replace(/\./g, '-')			// Replace periods with -
			.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
			.replace(/\-\-+/g, '-')         // Replace multiple - with single -
			.replace(/^-+/, '')             // Trim - from start of text
			.replace(/-+$/, '');            // Trim - from end of text
	}

	function updateLinks() {
		headers = Array.from(document.querySelectorAll('h1.markdown, h2.markdown, h3.markdown'));
		headers.forEach((header) => {
			// Headers may contain values that change in response to user input, so we create our anchors as the initial value of the header.
			// We lowercase the innerText and replace spaces with hyphens to match the default slugify behavior in markdown.
			header.id = slugify(header.innerText);
		});
	}

	function observeDocumentChanges() {
    // Need to observe entire article because headers may be added or removed by inputs
	const articleContent = document.querySelector('article');

    if (!articleContent) {
        console.error('Element with tag "article" not found');
        return;
    }

    observer = new MutationObserver(() => {
        updateLinks();
    });

    observer.observe(articleContent, { childList: true, subtree: true });

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
		<a
			href={'#' + header.id}
			class={header.nodeName.toLowerCase()}
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

	a.h3 {
		@apply pl-3 text-gray-500;
	}

	a.h2 {
		@apply pl-0 text-gray-500;
	}

	a.h1 {
		@apply mt-3 font-semibold block bg-white shadow shadow-white;
	}
</style>
