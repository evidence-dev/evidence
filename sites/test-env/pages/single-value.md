<script>
	const datas = [
		{ price: 59.99 },
		{ price: 10.99 },
		{ price: 29.99 },
		{ price: 99.99 }
	];
</script>

## BigValues

{#each datas as row}
	<BigValue data={row} value="price" />
{/each}

## Values

<ul>
{#each datas as row, i}
	<li>
		{i+1}: <Value data={row} value="price" />
	</li>
{/each}
</ul>

## Random DataTable

<DataTable data={datas} />
