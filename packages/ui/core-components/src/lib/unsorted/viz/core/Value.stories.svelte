<script context="module">
	import Value from './Value.svelte';
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/Value',
		component: Value,
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	const data = Query.create(`SELECT * from flights`, query);
	// const data = Query.create(`SELECT * from flights`, query)
	// 	.groupBy(undefined)
	// 	.agg({ sum: { col: 'fare', as: 'total' } });
</script>

```
<Story name="Basic Usage">
	<Value {data} />
</Story>
<Story name="Agg Usage">
	<!-- <Value data={data.groupBy(undefined).agg({ sum: { col: 'fare', as: 'total' } })} fmt="usd0" /> -->
	<Value {data} column="total" agg="sum" fmt="usd0" />

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
```
