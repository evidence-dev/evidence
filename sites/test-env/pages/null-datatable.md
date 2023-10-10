```datum
SELECT '1' AS id, null AS username UNION ALL SELECT '2' as id, 'johndoe' AS username UNION ALL SELECT '3' as id, 'janedoe' as username;
```

<DataTable data={datum}>
	<Column id=username />
	<Column id=id linkLabel=username contentType=link />
</DataTable>
