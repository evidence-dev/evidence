<script>
	// Mocks universal SQL and global input stores, adds UI to show these in stories.
	// imports the styles included with the CLI
	import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { setTrackProxy } from '@evidence-dev/sdk/usql';
	import DebugBar from './DebugBar.svelte';

	setQueryFunction(query);

	const inputStore = writable(
		setTrackProxy({
			label: '',
			value: '(SELECT NULL WHERE 0 /* An Input has not been set */)'
		})
	);
	setContext(INPUTS_CONTEXT_KEY, inputStore);

	import '@evidence-dev/tailwind/fonts.css';
	import '../../../../../../sites/example-project/src/app.css';
</script>

<slot />

<DebugBar />
