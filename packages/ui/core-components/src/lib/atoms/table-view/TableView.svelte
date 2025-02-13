<script>
	import { Abc, Calendar, _123, CircleHalf2 } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { cn } from '../../utils.js';

	/** @type {import("@evidence-dev/sdk/usql").DescribeResultRow[]}*/
	export let columns = [];

	export let rowClass = '';
	let _class = '';
	export { _class as class };

	const getIcon = (columnType) => {
		switch (columnType.toUpperCase()) {
			case 'INT':
			case 'INTEGER':
			case 'BIGINT':
			case 'SMALLINT':
			case 'TINYINT':
			case 'DOUBLE':
				return _123;
			case 'DATE':
			case 'DATETIME':
			case 'TIMESTAMP':
				return Calendar;
			case 'BOOLEAN':
				return CircleHalf2;
			default:
				return Abc;
		}
	};
</script>

<ul class={cn('list-none m-0 flex flex-col gap-1', _class)}>
	{#each columns as column (column.column_name)}
		{@const columnType = column.data_type ?? column.column_type}
		<li
			class={cn(
				`font-mono text-sm rounded-sm flex flex-row hover:bg-base-200 max-w-full`,
				rowClass
			)}
		>
			<div class="grid grid-cols-[auto,auto,1fr] gap-2 px-2 py-1 w-full lowercase truncate">
				<Icon src={getIcon(columnType)} class="text-base-content-muted w-5 h-5" />

				{columnType}
				<b class="lowercase truncate">{column.column_name}</b>
			</div>
		</li>
	{/each}
</ul>
