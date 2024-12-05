<script>
	import { getContext, onMount } from 'svelte';
	import { get } from 'svelte/store';

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

	const metricsStore = getContext('metrics');

	const timeSeriesStore = getContext('timeSeriesStore');

	// $: {
	// 	if ($timeSeriesStore) {
	// 		const currentMetrics = $timeSeriesStore.metrics;
	// 		console.log('currentMetrics', currentMetrics);
	// 		timeSeriesStore.update((store) => ({
	// 			...store,
	// 			metrics: [...currentMetrics, { metric, label, link, downIsGood }]
	// 		}));
	// 	}
	// }

	// onMount(() => {
	// 	return () => {
	// 		if (timeSeriesStore) {
	// 			const currentMetrics = $timeSeriesStore.metrics;
	// 			console.log('currentMetrics', currentMetrics);
	// 			const updatedMetrics = currentMetrics.filter(
	// 				(m) =>
	// 					m.metric !== metric ||
	// 					m.label !== label ||
	// 					m.link !== link ||
	// 					m.downIsGood !== downIsGood
	// 			);
	// 			console.log('updatedMetrics', updatedMetrics);
	// 			timeSeriesStore.update((store) => ({ ...store, metrics: updatedMetrics }));
	// 		}
	// 	};
	// });
	$: {
		if (metricsStore) {
			const currentMetrics = get(metricsStore);
			metricsStore.set([...currentMetrics, { metric, label, link, downIsGood }]);
		}
	}

	onMount(() => {
		return () => {
			if (metricsStore) {
				const currentMetrics = get(metricsStore);
				const updatedMetrics = currentMetrics.filter(
					(m) =>
						m.metric !== metric ||
						m.label !== label ||
						m.link !== link ||
						m.downIsGood !== downIsGood
				);
				metricsStore.set(updatedMetrics);
			}
		};
	});
</script>
