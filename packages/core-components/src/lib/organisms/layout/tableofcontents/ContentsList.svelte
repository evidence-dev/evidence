<script>
	import { onMount, onDestroy } from 'svelte';

	let headers = [];
	let observer;

	function slugify(text) {
		return text
			.toString()
			.toLowerCase()
			.replace(/[\s\.]+/g, '-') // Replace spaces and periods with -
			.replace(/[^-\w]+/g, '') // Remove all non-word chars except -
			.replace(/^-+|-+$/g, ''); // Trim - from start and end of text
	}

	function updateLinks() {
		headers = Array.from(
			document.querySelector('article').querySelectorAll('h1.markdown, h2.markdown, h3.markdown')
		);
		let headerCounts = {};

		headers.forEach((header) => {
			let slug = slugify(header.innerText);

			let count = headerCounts[slug] || 0; // Get current count or default to 0 if not encountered before

			// If count is more than 0, append count to id
			header.id = count > 0 ? `${slug}-${count}` : slug;
			headerCounts[slug] = count + 1;
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
		<a href={'#' + header.id} class={header.nodeName.toLowerCase()}>
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
