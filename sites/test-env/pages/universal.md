<script>
    let insert_limit_here = "limit 10";
</script>

<input type="text" bind:value={insert_limit_here} />

```something
select * from test ${insert_limit_here}
```

```something_else
select * from ${something} LIMIT 5
```

something_else[0].VendorID: {something_else[0]?.VendorID}

something_else.length: {something_else.length}

something[0].VendorID: {something[0]?.VendorID}

something.length: {something.length}

<DataTable data={something} />
