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
