<!--
	This component translates the `y` and `y2` props from a string or array into a child for each on the appropriate axis
-->

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UserComponentProps } from '../../../types';
	import isString from 'lodash/isString';
	import type { SeriesProps } from '../combo_chart/series/Series.svelte';
	import { schema } from './schema';

	type Props = UserComponentProps<typeof schema> & {
		seriesSnippet: Snippet<[Pick<SeriesProps, 'y' | 'axis' | 'series' | 'yLabel'>]>;
		/** Per-`y` legend labels (metric mode), positionally aligned with `y`. */
		y_labels?: string[];
	};

	const props: Props = $props();
	const yArr: string[] = $derived(Array.isArray(props.y) ? props.y.filter(isString) : [props.y]);
	const y2Arr: string[] = $derived(
		Array.isArray(props.y2) ? props.y2.filter(isString) : props.y2 ? [props.y2] : []
	);
</script>

{#each yArr as y, i (y)}
	{@render props.seriesSnippet({
		y,
		axis: 'y1',
		series: props.series,
		yLabel: props.y_labels?.[i]
	})}
{/each}
{#each y2Arr as y (y)}
	{@render props.seriesSnippet({ y, axis: 'y2', series: props.series })}
{/each}
