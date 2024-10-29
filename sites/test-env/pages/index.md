```sql xyz
SELECT * FROM orders LIMIT 5000
```

<DataTable data={xyz} search/>

```sql semicolon_comment_test
SELECT /* ; */ ';', * FROM orders LIMIT 5000 -- This should run without issues
-- ;;;;
/*
    Hi;;
*/; -- note that the trailing semicolon is all the way down here
```

{console.log({inputs, $inputs, inputs_store, $inputs_store})}