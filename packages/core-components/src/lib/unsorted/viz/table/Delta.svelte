<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { formatValue } from '@evidence-dev/component-utilities/formatting';

	export let value = undefined; // row[column.id]
	export let downIsGood = false; // column.downIsGood
	export let format;
	// export let fmt = 'num'; // column.fmt
	// export let columnFormat; // safeExtractColumn(column, columnSummary).format
	// export let columnValueType = typeof value; // safeExtractColumn(column, columnSummary).format?.valueType
	export let columnUnitSummary;
	export let showValue = true; // column.showValue
	export let deltaSymbol = true; // column.deltaSymbol
	export let align = 'right'; // column.align
</script>

<span
	class="m-0 text-xs font-medium font-ui inline-block"
	style="color: {(value >= 0 && !downIsGood) || (value < 0 && downIsGood)
		? 'var(--green-700)'
		: 'var(--red-700)'}"
>
	<span style:text-align={align ?? 'right'}>
		{#if showValue}
			<span>
				{formatValue(value, format, columnUnitSummary)}
			</span>
			{#if deltaSymbol}
				<span class="font-[system-ui]">{@html value >= 0 ? '&#9650;' : '&#9660;'}</span>
			{/if}
		{/if}
	</span>
</span>
