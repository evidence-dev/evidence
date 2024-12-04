<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	let v = 5;

	let reactiveQuery;
	const reactiveQueryFactory = Query.createReactive(
		{ callback: (v) => (reactiveQuery = v), execFn: query },
		{ initialData: [{ initialData: 'Change the story source code and this should go away' }] }
	);
	$: reactiveQueryFactory(`SELECT ${v}`);
</script>

<label>
	Demo Input
	<input class="bg-base-300" type="number" bind:value={v} />
</label>

<pre>
    {JSON.stringify(reactiveQuery)}
</pre>
