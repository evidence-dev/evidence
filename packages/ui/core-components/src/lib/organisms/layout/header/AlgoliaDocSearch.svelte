<script>
	import '@docsearch/css/dist/_variables.css';
	import '@docsearch/css/dist/modal.css';
	import './SearchButton.css';
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
</script>

<div id="docsearch" />
