<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	let v = 5;

	const reactiveQueryFactory = Query.createReactive(
		{ callback: (v) => (reactiveQuery = v), execFn: query },
		{ initialData: [{ initialData: 'Change the story source code and this should go away' }] }
	);
	let reactiveQuery;
	$: reactiveQueryFactory(`SELECT ${v}`);
</script>

<label>
	Demo Input
	<input class="bg-gray-300" type="number" bind:value={v} />
</label>

<pre>
    {JSON.stringify(reactiveQuery)}
</pre>
