<script lang="ts">
	import { onMount } from 'svelte';
	import { getComboChartContext } from '../../combo-chart-context';
	import type { ReferencePointStaticProps } from './types';

	const props: ReferencePointStaticProps = $props();

	const context = getComboChartContext();
	onMount(() => {
		const { removeReferencePoint } = context.addReferencePoint(() => props);
		return removeReferencePoint;
	});
</script>
