<script>
	// Mocks universal SQL and global input stores, adds UI to show these in stories.
	// imports the styles included with the CLI
	import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import { ensureInputContext } from '@evidence-dev/sdk/utils/svelte';
	import DebugBar from './DebugBar.svelte';

	setQueryFunction(query);
	ensureInputContext();

	import '@evidence-dev/tailwind/fonts.css';
	import '../../../../../../sites/example-project/src/app.css';
</script>

<slot />

<DebugBar />
