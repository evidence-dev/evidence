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

	// const metricsStore = getContext('metrics');

	const store = getContext('store');

	$: {
		if (store) {
			store.updateMetrics({ metric, label, link, downIsGood, fmt });
		}
	}

	// $: {
	// 	if (metricsStore) {
	// 		const currentMetrics = get(metricsStore);
	// 		metricsStore.set([...currentMetrics, { metric, label, link, downIsGood }]);
	// 	}
	// }

	// onMount(() => {
	// 	return () => {
	// 		if (metricsStore) {
	// 			const currentMetrics = get(metricsStore);
	// 			const updatedMetrics = currentMetrics.filter(
	// 				(m) =>
	// 					m.metric !== metric ||
	// 					m.label !== label ||
	// 					m.link !== link ||
	// 					m.downIsGood !== downIsGood
	// 			);
	// 			metricsStore.set(updatedMetrics);
	// 		}
	// 	};
	// });
</script>
