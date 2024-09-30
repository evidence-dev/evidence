<script context="module">
	import Value from './Value.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/Value',
		component: Value
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const data = Query.create(`SELECT * from flights`, query);
	const data2 = Query.create(`SELECT MAX(fare)*-1 as NegativeFare from flights`, query);
	const forEachData = Query.create(
		`SELECT sum(x) as total_x,sum(y) as total_y, series from numeric_series group by series`,
		query
	);
</script>

<Story name="Basic Usage">
	<Value {data} />
</Story>
<Story name="Agg sum Usage">
	<Value {data} column="fare" agg="sum" fmt="usd0" />
	<!--
        Goal:
        <Value
            data={data}
            column=fare
            agg=sum
            fmt=usd0
        />
    -->
</Story>
<Story name="Agg avg Usage">
	<Value {data} column="fare" agg="avg" fmt="usd0" />
</Story>
<Story name="Agg max Usage">
	<Value {data} column="fare" agg="max" fmt="usd0" />
</Story>
<Story name="Agg min Usage">
	<Value {data} column="fare" agg="min" fmt="usd0" />
</Story>
<Story name="Agg median Usage">
	<Value {data} column="fare" agg="median" fmt="usd0" />
</Story>
<Story name="Scale Color">
	<div>Min color=#00FF00 - <Value {data} column="fare" agg="min" fmt="usd0" color="#00FF00" /></div>
	<div>Max color=#674EA7 - <Value {data} column="fare" agg="max" fmt="usd0" color="#674EA7" /></div>
	<div>Median color="" - <Value {data} column="fare" agg="median" fmt="usd0" color="" /></div>
	<div>
		Avg color="#45818E" redNegatives="true" - <Value
			{data}
			column="fare"
			agg="avg"
			fmt="usd0"
			color="#45818E"
			redNegatives="true"
		/>
	</div>
	<div>
		NegativeValue color="#45818E" redNegatives="true" - <Value
			data={data2}
			column="NegativeFare"
			agg="avg"
			fmt="usd0"
			color="#45818E"
			redNegatives="true"
		/>
	</div>
	<div>
		NegativeValue redNegatives="true" - <Value
			data={data2}
			column="NegativeFare"
			agg="avg"
			fmt="usd0"
			redNegatives="true"
		/>
	</div>
</Story>
<Story name="Data as Array">
	{#each $forEachData as my_row}
		{my_row.series}
		<div>
			<p>Y Total:</p>
			<Value data={my_row} value="total_y" color="#00FF00" />
		</div>
		<div style="margin-bottom: 1em;">
			<p>X Total:</p>
			<Value data={my_row} value="total_x" color="#674EA7" />
		</div>
	{/each}
</Story>
