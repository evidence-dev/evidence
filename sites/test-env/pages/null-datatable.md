```sql datum
SELECT 	'/subfolder-no-index/1' AS id,
		'/subfolder-no-index/10' AS id2,
		null AS username
UNION ALL
SELECT 	'/subfolder-no-index/2' as id,
		'/subfolder-no-index/20' as id2,
		'johndoe' AS username
UNION ALL
SELECT 	'/subfolder-no-index/3' as id,
 		null as id2,
		'janedoe' as username
```

<DataTable data={datum}>
	<Column id=username />
	<Column id=id linkLabel=username contentType=link />
	<Column id=id2 linkLabel="see more ->" contentType=link />
</DataTable>
