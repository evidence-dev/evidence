```sql my_query
	select '/page-a' as link_col
	union all
	select '/nested/page-c' as link_col
```

<DataTable data={my_query} link=link_col>
	<Column id=link_col title=Link />
</DataTable>
