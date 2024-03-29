<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	let v = 5;

	let queryText = `SELECT ${v}`;
	$: queryText = `SELECT ${v}`;

	let { initialValue: data, updater: queryFactory } = Query.reactive(query, queryText);

	$: queryFactory(queryText).then((v) => (data = v));
</script>

<label>
	Demo Input
	<input class="bg-gray-300" type="number" bind:value={v} />
</label>

<pre>
    {$data?.originalText}
</pre>

<pre>
    {JSON.stringify($data)}
</pre>