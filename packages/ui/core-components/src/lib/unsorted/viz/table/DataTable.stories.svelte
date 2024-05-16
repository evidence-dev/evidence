<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = { title: 'Charts/DataTable', decorators: [() => WithScopedInputStore] };
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import DataTable from './DataTable.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	import QueryLoad from '$lib/atoms/query-load/QueryLoad.svelte';
</script>

<Story name="Basic Usage">
	{@const data = Query.create(
		`SELECT 'E:T9I,M:D3H,M:Q19E,M:T30A,M:A63T,M:A104V,N:P13L,N:R203K,N:G204R,N:Q229K,N:S413R,ORF1a:S135R,ORF1a:A211D,ORF1a:T842I,ORF1a:V1056L,ORF1a:G1307S,ORF1a:S1924N,ORF1a:K1973R,ORF1a:N2526S,ORF1a:A2710T,ORF1a:L3027F,ORF1a:T3090I,ORF1a:T3255I,ORF1a:P3395H,ORF1a:R3821K,ORF1a:T4175I,ORF1b:P314L,ORF1b:R1315C,ORF1b:I1566V,ORF1b:P1664S,ORF1b:L1890F,ORF1b:T2163I,ORF3a:T223I,ORF6:D61L,ORF9b:P10S,S:T19I,S:R21T,S:A27S,S:S50L,S:V127F,S:G142D,S:F157S,S:R158G,S:L212I,S:V213G,S:L216F,S:H245N,S:A264D,S:I332V,S:G339H,S:K356T,S:S371F,S:S373P,S:S375F,S:T376A,S:R403K,S:D405N,S:R408S,S:K417N,S:N440K,S:V445H,S:G446S,S:N450D,S:L452W,S:L455S,S:N460K,S:S477N,S:T478K,S:N481K,S:E484K,S:F486P,S:Q498R,S:N501Y,S:Y505H,S:E554K,S:A570V,S:D614G,S:P621S,S:H655Y,S:N679K,S:P681R,S:N764K,S:S939F,S:Q954H,S:N969K,S:P1143L,S:S1170P' as item`,
		query
	)}
	<QueryLoad {data} let:loaded>
		<DataTable {loaded} search="true"></DataTable>
	</QueryLoad>
</Story>
