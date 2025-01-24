<script>
	// Mocks universal SQL and global input stores, adds UI to show these in stories.
	// imports the styles included with the CLI
	import '../src/app.css';
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
	import { getThemeStores } from '../themes/themes.js';

	const { syncThemeAttribute } = getThemeStores();
	onMount(() => syncThemeAttribute(document.querySelector('html')));
	onMount(() => {
		document.body.classList.add('bg-base-100');
		document.body.classList.add('text-base-content');
		return () => {
			document.body.classList.remove('bg-base-100');
			document.body.classList.remove('text-base-content');
		};
	});
</script>

<slot />

<DebugBar />
