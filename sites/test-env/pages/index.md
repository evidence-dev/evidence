```sql xyz
SELECT * FROM orders LIMIT 5000
```

<DataTable data={xyz}/>

```sql semicolon_comment_test
SELECT /* ; */ ';', * FROM orders LIMIT 5000 -- This should run without issues
-- ;;;;
/*
    Hi;;
*/; -- note that the trailing semicolon is all the way down here
```