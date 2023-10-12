```datum
SELECT '1' AS id, '10' AS id2, null AS username UNION ALL SELECT '2' as id, '20' as id2, 'johndoe' AS username UNION ALL SELECT '3' as id, '30' as id3, 'janedoe' as username;
```

<DataTable data={datum}>
	<Column id=username />
	<Column id=id linkLabel=username contentType=link />
	<Column id=id2 linkLabel="see more ->" contentType=link />
</DataTable>
