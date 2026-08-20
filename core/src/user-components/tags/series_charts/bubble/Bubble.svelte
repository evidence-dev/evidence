<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import type { SeriesInternalProps } from '../combo_chart/series/Series.svelte';
	import Series from '../combo_chart/series/Series.svelte';
	import merge from 'lodash/merge';

	type Props = UserComponentProps<typeof schema> & { tagName?: string };
	const { tagName = 'bubble', size, ...props }: Props = $props();

	const transformSeriesOptions: SeriesInternalProps['transformSeriesOptions'] = $derived(
		(options) => {
			merge(options, {
				itemStyle: {
					opacity: props.opacity
				},
				tooltip: {
					trigger: 'item'
				}
			});
			if (props.echarts_options) merge(options, props.echarts_options);
		}
	);
</script>

<Series type="scatter" {tagName} {size} {...props} {transformSeriesOptions} />
