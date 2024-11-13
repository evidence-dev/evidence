<script>
	// Mocks universal SQL and global input stores, adds UI to show these in stories.
	// imports the styles included with the CLI
	import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { writable } from 'svelte/store';
	import { ensureInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { setTrackProxy } from '@evidence-dev/sdk/usql';
	import DebugBar from './DebugBar.svelte';

	setQueryFunction(query);
	ensureInputContext(
		writable(
			setTrackProxy({
				label: '',
				value: '(SELECT NULL WHERE 0 /* An Input has not been set */)'
			})
		)
	);

	import '@evidence-dev/tailwind/fonts.css';
	import '../../../../../../sites/example-project/src/app.css';
	import { onMount } from 'svelte';
	import { getThemeStores } from '../themes.js';

	const { syncDataThemeAttribute } = getThemeStores();
	onMount(() => syncDataThemeAttribute(document.querySelector('html')));
</script>

<slot />

<DebugBar />

<style lang="postcss">
	:global(body) {
		@apply bg-base-100;
	}
	:global(*) {
		@apply text-base-content;
	}
</style>
