<script>
	import QueryLoad from '../../../atoms/query-load/QueryLoad.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';
	import EmptyChart from '../core/EmptyChart.svelte';
	import BaseMap from './BaseMap.svelte';
	import ComponentTitle from '../core/ComponentTitle.svelte';
	import { toBoolean } from '$lib/utils.js';

	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let data;

	/** @type {string|undefined} */
	export let title = undefined;

	/** @type {string|undefined} */
	export let subtitle = undefined;

	/** @type {'pass' | 'warn' | 'error' | undefined} */
	export let emptySet = undefined;

	/** @type {string | undefined} */
	export let emptyMessage = undefined;

	/** @type {string} */
	export let chartType = undefined;

	/** @type {boolean} */
	export let isInitial = true;
	$: isInitial = toBoolean(isInitial);

	export let error = undefined;

	export let height = undefined;
</script>

<div class="mt-2 mb-4">
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} />
	{/if}

	<QueryLoad {data} {height} let:loaded>
		<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
		<ErrorChart let:loaded slot="error" title={chartType} error={error ?? loaded.error.message} />

		<BaseMap {...$$restProps} title={undefined} {height}>
			<slot data={loaded} />
		</BaseMap>
	</QueryLoad>
</div>
