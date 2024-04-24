<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	let v = 5;

	// let queryText = `SELECT ${v}`;
	// $: queryText = `SELECT ${v}`;

	// let { initialValue: data, updater: queryFactory } = Query.reactive(query, queryText);

	// $: queryFactory(queryText).then((v) => (data = v));

	const react = Query.reactive2(
		{ callback: (v) => (reactiveQuery = v), execFn: query },
		{ initialData: [{ initialData: 'Change the story source code and this should go away' }] }
	);
	let reactiveQuery;

	$: react(`SELECT ${v}`);
</script>

<label>
	Demo Input
	<input class="bg-gray-300" type="number" bind:value={v} />
</label>

<!-- <pre>
    {$data?.originalText}
</pre>

<pre>
    {JSON.stringify($data)}
</pre> -->
<pre>
    {JSON.stringify($reactiveQuery)}
</pre>
