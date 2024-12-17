<script>
	import QueryLoad from '../../../atoms/query-load/QueryLoad.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';
	import EmptyChart from '../core/EmptyChart.svelte';
	import BaseMap from './BaseMap.svelte';

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let data;

	/** @type {string|undefined} */
	export let title = undefined;

	/** @type {'pass' | 'warn' | 'error' | undefined} */
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	/** @type {string} */
	export let chartType = undefined;

	/** @type {boolean} */
	export let isInitial = true;

	export let error = undefined;
</script>

<div style="margin-top: 15px; margin-bottom: 10px;">
	{#if title}
		<h4 class="markdown mb-2">{title}</h4>
	{/if}

	<QueryLoad {data} let:loaded>
		<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
		<ErrorChart let:loaded slot="error" title={chartType} error={error ?? loaded.error.message} />

		<BaseMap {...$$restProps} title={undefined}>
			<slot data={loaded} />
		</BaseMap>
	</QueryLoad>
</div>
