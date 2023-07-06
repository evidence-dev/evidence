<script>
    let queryString = `
WITH X AS (
    SELECT f.from, f.to, f.departure_time, a.* FROM flight f
    INNER JOIN aircraft a on a.id = f.aircraft
)
SELECT COUNT(*) as flights, date_trunc('day', departure_time) as departure FROM X group by date_trunc('day', departure_time) order by 2 asc
`.trim()
    , tempQueryString = queryString + ""
</script>

<textarea bind:value={tempQueryString} class="px-2 py-1 bg-gray-100 border border-gray-900 w-full h-72 font-mono"/>

<button on:click={() => queryString = tempQueryString} class="px-2 py-1 bg-green-800 rounded text-white">Run Query</button>

```q
${queryString}
```

<LineChart data={q} x="departure" y="flights" title="Airports with most departing flights"/>

<DataTable data={q}/>
