<script>
    let queryString = `SELECT 1;`.trim()
    , tempQueryString = queryString + ""
</script>

This page contains a simple demo query console for the new Universal SQL engine for Evidence.
You can view a basic explainer of the schema in the new [schema explorer](/explore/schema), this should improve over time.

<textarea bind:value={tempQueryString} class="px-2 py-1 bg-gray-100 border border-gray-900 w-full h-72 font-mono"/>

<button on:click={() => queryString = tempQueryString} class="px-2 py-1 bg-green-800 rounded text-white">
Run Query
</button>

```q
${queryString}
```

<DataTable data={q}/>
