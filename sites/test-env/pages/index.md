<script>
    let queryString = `SELECT * FROM information_schema.columns WHERE table_name = 'comments'`.trim(), tempQueryString = queryString + ""
</script>

This page contains a simple demo query console for the new Universal SQL engine for Evidence.
You can view a basic explainer of the schema in the new [schema explorer](/explore/schema), this should improve over
time.

<textarea bind:value={tempQueryString} class="px-2 py-1 bg-gray-100 border border-gray-900 w-full h-72 font-mono"/>

<button on:click={() => queryString = tempQueryString} class="px-2 py-1 bg-green-800 rounded text-white">
Run Query
</button>

```q
${queryString}
```

<DataTable data={q}/>

<BigValue data={q} value=x comparison=y/>

```jank
SELECT * FROM ${q}
```

```break_strict
this should break strict, because it isn't a real query.
```

```real_comments
SELECT user_id FROM social_media_example.comments
```

```fake_comments
SELECT _id FROM not_social_media_example.comments
```
