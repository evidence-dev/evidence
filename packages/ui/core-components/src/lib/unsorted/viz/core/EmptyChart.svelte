<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import ErrorChart from './ErrorChart.svelte';
	import ValueError from './ValueError.svelte';
	import BigValueError from './BigValueError.svelte';

	export let isInitial = true;

	/** @type {"pass" | "warn" | "error"}*/
	export let emptySet = 'error';

	/** @type {string}*/
	export let emptyMessage = 'No Records';

	export let chartType = 'Component';

	let error =
		'Dataset is empty - query ran successfully, but no data was returned from the database';

	if (chartType === 'Big Value') {
		error = 'Dataset is empty';
	}

	if (emptySet === 'error' && isInitial) {
		const setTextRed = '\x1b[31m%s\x1b[0m';
		console.error(setTextRed, `Error in ${chartType}: ${error}`);
		if (strictBuild) {
			throw Error(error);
		}
	} else if (emptySet === 'warn' && isInitial) {
		console.warn(
			`Warning in ${chartType}: Dataset is empty - query ran successfully, but no data was returned from the database`
		);
	}
</script>

{#if ['warn', 'pass'].includes(emptySet) || !isInitial}
	{#if chartType === 'Value'}
		<span
			class="text-xs text-base-content-muted p-2 my-2 w-full border border-base-300 border-dashed rounded"
			>{emptyMessage}</span
		>
	{:else if chartType === 'Big Value'}
		<p
			class="text-xs text-base-content-muted p-2 pt-[32px] my-0 text-center w-full align-middle h-[80px] border border-base-300 border-dashed rounded min-w-[120px]"
		>
			{emptyMessage}
		</p>
	{:else}
		<p
			class="text-xs text-base-content-muted p-2 my-2 w-full border border-base-300 border-dashed rounded"
		>
			{emptyMessage}
		</p>
	{/if}
{:else if chartType === 'Value'}
	<ValueError {error} />
{:else if chartType === 'Big Value'}
	<BigValueError {error} />
{:else}
	<ErrorChart title={chartType} {error} />
{/if}
