<script>
	import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
	import {
		initDB,
		setParquetURLs,
		updateSearchPath,
		query
	} from '@evidence-dev/universal-sql/client-duckdb';

	const initializing = (async () => {
		await initDB();
		const res = await fetch('/data/manifest.json').then((r) => r.json());
		await setParquetURLs(res.renderedFiles ?? {});
		await updateSearchPath(Object.keys(res.renderedFiles ?? {}));
		if (!res.renderedFiles) console.error('No fixture data available!');
		// Test Query
		const r = await query('SELECT * FROM information_schema.tables');
		if (r.length === 0) throw new Error('Failed to run test query');
		console.log('Universal SQL has been initialized successfully');
	})();
	setQueryFunction(query);
</script>

{#await initializing}
	Universal SQL is loading...
{:then}
	<slot />
{:catch e}
	Universal SQL failed to initialize.

	{e}
{/await}
