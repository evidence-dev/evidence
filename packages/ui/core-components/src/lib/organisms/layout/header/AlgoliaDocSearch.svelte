<script>
	import '@docsearch/css/dist/_variables.css';
	import '@docsearch/css/dist/modal.css';
	import { onMount } from 'svelte';
	import docsearch from '@docsearch/js';

	export let algolia;

	onMount(() => {
		docsearch({
			container: '#docsearch',
			appId: algolia?.appId,
			apiKey: algolia?.apiKey,
			indexName: algolia?.indexName
		});
	});

	const DocSearchButtonClasses = `
	**:[&.DocSearch-Button]:bg-base-100
	**:[&.DocSearch-Button]:border-base-300
	**:[&.DocSearch-Button]:hover:bg-base-200/40
	**:[&.DocSearch-Button]:transition-colors
	**:[&.DocSearch-Button]:duration-200
	**:[&.DocSearch-Button]:rounded-md
	**:[&.DocSearch-Button]:flex
	**:[&.DocSearch-Button]:gap-16
	**:[&.DocSearch-Button]:cursor-pointer
	**:[&.DocSearch-Button]:py-1
	**:[&.DocSearch-Button]:pl-2
	**:[&.DocSearch-Button]:sm:pr-1
	**:[&.DocSearch-Button]:pr-20
	**:[&.DocSearch-Button]:sm:text-xs
	**:[&.DocSearch-Button]:border
	**:[&.DocSearch-Button]:font-sans
	**:[&.DocSearch-Button]:font-medium
	**:[&.DocSearch-Button]:items-center;
	`;
	const DocSearchButtonPlaceholderClasses = `
	**:[&DocSearch-Button-Placeholder]:text-base-content-muted
	`;
	const DocSearchSearchIconClasses = `
	**:[&.DocSearch-Search-Icon]:hidden
	`;
	const DocSearchButtonKeyClasses = `
	**:[&.DocSearch-Button-Key,&.DocSearch-Control-Key-Icon]:text-base-content-muted
	**:[&.DocSearch-Button-Key,&.DocSearch-Control-Key-Icon]:*:text-base-content-muted
	`;
</script>

<div
	id="docsearch"
	class="{DocSearchButtonClasses} {DocSearchButtonPlaceholderClasses} {DocSearchSearchIconClasses} {DocSearchButtonKeyClasses}"
/>
