<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import ComboChart, { type ComboChartInternalProps } from '../combo_chart/ComboChart.svelte';
	import Bubble from '../bubble/Bubble.svelte';
	import MultiSeries from '../MultiSeries/MultiSeries.svelte';
	import merge from 'lodash/merge';

	const props: UserComponentProps<typeof schema> = $props();

	const transformOptions: ComboChartInternalProps['transformOptions'] = $derived((options) => {
		merge(options, {
			tooltip: {
				trigger: 'item'
			}
		});
	});
</script>

<ComboChart {...props} tagName="bubble_chart" {transformOptions}>
	<MultiSeries {...props}>
		{#snippet seriesSnippet(multiSeriesProps)}
			<Bubble
				{...multiSeriesProps}
				size={props.size}
				opacity={props.opacity}
				fmt={props.fmt}
				data_labels={props.data_labels}
				tagName="bubble_chart"
			/>
		{/snippet}
	</MultiSeries>

	{@render props.children?.()}
</ComboChart>
