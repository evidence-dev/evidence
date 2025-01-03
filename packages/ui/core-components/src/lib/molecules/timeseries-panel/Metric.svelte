<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';

	/**
	 * @typedef {Object} MetricProps
	 * @property {string} metric - The metric value to display
	 * @property {string} label - The label for the metric
	 * @property {string} link - The URL to navigate to when clicked
	 * @property {boolean} downIsGood - Indicates if a lower value is considered better
	 */

	/** @type {MetricProps} */
	export let metric;
	/** @type {MetricProps} */
	export let label = undefined;
	/** @type {MetricProps} */
	export let link = undefined;
	/** @type {MetricProps} */
	export let downIsGood = false;
	export let fmt = undefined;


	const store = getContext('store');

	$: {
		if (store) {
			store.updateMetrics({ metric, label, link, downIsGood, fmt });
		}
	}

</script>
