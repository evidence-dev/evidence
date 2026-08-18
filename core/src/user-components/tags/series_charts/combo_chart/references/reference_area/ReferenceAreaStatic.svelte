<script lang="ts">
	import { onMount } from 'svelte';
	import { getComboChartContext } from '../../combo-chart-context';
	import type { ReferenceAreaStaticProps } from './types';

	const props: ReferenceAreaStaticProps = $props();

	const context = getComboChartContext();
	onMount(() => {
		const { removeReferenceArea } = context.addReferenceArea(() => props);
		return removeReferenceArea;
	});
</script>
