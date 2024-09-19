```datum
SELECT '7 days' as cohort, 'stuff' as metadata, 100 as a, 200 as b
```

<ButtonGroup name="dimension">
	<ButtonGroupItem value="a" valueLabel="a" />
	<ButtonGroupItem value="b" valueLabel="b" />
</ButtonGroup>

<DataTable data={datum}>
	<Column id="cohort" title="Week" />
	<Column id={inputs.dimension} />
	<Column id="metadata" title="Metadata" />
</DataTable>
