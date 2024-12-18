<script>
	$: if (nully.loaded) {
		console.log([...nully])
		if (nully[0].from_canada !== true) throw new Error('from_canada should be true');
		if (nully[1].from_canada !== true) throw new Error('from_canada should be true');
		if (nully[2].from_canada !== false) throw new Error('from_canada should be false');
	}
</script>

```nully
SELECT * FROM nullish_dates
```

<DataTable data={nully} />
