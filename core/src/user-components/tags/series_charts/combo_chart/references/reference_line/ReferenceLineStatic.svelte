<script lang="ts">
	import { onMount } from 'svelte';
	import { getComboChartContext } from '../../combo-chart-context';
	import type { ReferenceLineStaticProps } from './types';

	const props: ReferenceLineStaticProps = $props();

	const context = getComboChartContext();
	onMount(() => {
		const { removeReferenceLine } = context.addReferenceLine(() => props);
		return removeReferenceLine;
	});
</script>
