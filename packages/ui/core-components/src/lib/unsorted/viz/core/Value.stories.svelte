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
	import DataTable from '../table/DataTable.svelte';

	const data = Query.create(`SELECT * from flights`, query);
	const data2 = Query.create(`SELECT MAX(fare)*-1 as NegativeFare from flights`, query);
</script>

```
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
<Story name="Link Prop Usage">
	<Value {data} column="fare" agg="median" fmt="usd0" link="https://evidence.dev/" />
</Story>

<Story name="Scale Color">
	<DataTable data={data2} />
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
