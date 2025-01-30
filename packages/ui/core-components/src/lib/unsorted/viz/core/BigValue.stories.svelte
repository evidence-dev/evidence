<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'Viz/BigValue',
		component: BigValue,
		argTypes: {
			title: {
				control: 'text'
			},
			minWidth: {
				control: 'number'
			},
			maxWidth: {
				control: 'number'
			},
			fmt: {
				control: 'text'
			},
			emptySet: {
				control: 'select',
				options: ['pass', 'warn', 'error']
			},
			emptyMessage: {
				control: 'text'
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	import BigValue from './BigValue.svelte';

	const data = Query.create(`select sum(fare) as total FROM flights`, query);

	const data2 = Query.create(
		`SELECT sum(x) as total_x,sum(y) as total_y, series from numeric_series group by series`,
		query
	);

	const data3 = Query.create(`select fare, departure_date from flights limit 10`, query);
</script>

<Story name="Basic" args={{ title: 'Basic Big Value', fmt: 'usd0', emptySet: 'pass' }} let:args>
	<BigValue {...args} {data} value="total" />
</Story>

<Story name="Data as Array" let:args>
	{#each $data2 as my_row}
		<BigValue {...args} data={my_row} value="total_y" />
	{/each}
</Story>

<Story name="Sparkline" args={{ sparklineColor: 'black' }} let:args>
	<BigValue {...args} data={data3} value="fare" sparkline="departure_date" />
</Story>
<Story name="Data Error" args={{ sparklineColor: 'black' }} let:args>
	<h1>No Data prop</h1>
	<BigValue {...args} data={undefined} value="fare" sparkline="departure_date" />
	<h1>No Value prop</h1>
	<BigValue {...args} data={data3} value="" sparkline="departure_date" />
	<h1>Data as String</h1>
	<BigValue {...args} data="data3" value="fare" sparkline="departure_date" />
	<h1>No props passed</h1>
	<BigValue {...args} />
	<h1>Invalid Sparklike prop</h1>
	<BigValue {...args} {data} value="total" sparkline="invalid" />
	<h1>empty string Sparklike prop</h1>
	<BigValue {...args} {data} value="total" sparkline="" />
	<h1>Invalid comparison prop</h1>
	<BigValue {...args} {data} value="total" sparkline="departure_date" comparison="invalid" />
	<h1>Empty string comparison prop</h1>
	<BigValue {...args} {data} value="total" sparkline="departure_date" comparison="" />
</Story>
