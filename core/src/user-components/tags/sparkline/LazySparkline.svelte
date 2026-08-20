<script lang="ts">
	import { onMount } from 'svelte';
	import SparklineDisplay from './SparklineDisplay.svelte';
	import { getPrintModeContext } from '../../../print-mode.context';

	interface Props {
		chartData: Array<[string | Date, number]>;
		type?: 'line' | 'area' | 'bar';
		color?: string;
		y_fmt?: string;
		x_fmt?: string;
		fit_to_data?: boolean;
		interactive?: boolean;
		class_name?: string;
		width?: number;
		height?: number;
		xEChartsType?: 'time' | 'category' | 'value';
		loading?: boolean;
	}

	const props: Props = $props();

	const width = $derived(props.width ?? 50);
	const height = $derived(props.height ?? 15);
	const class_name = $derived(props.class_name);

	let containerElement = $state<HTMLElement>();
	const printing = getPrintModeContext();
	let isVisible = $state(!!printing);
	let observer: IntersectionObserver | undefined;

	onMount(() => {
		// In print/PDF mode, render immediately without IO
		if (printing) return;
		if (!containerElement) return;

		// Create intersection observer with some margin to start loading slightly before visible
		observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting && !isVisible) {
					isVisible = true;
					// Once visible, we can disconnect the observer to save resources
					observer?.disconnect();
				}
			},
			{
				// Start loading when sparkline is 50px away from viewport
				rootMargin: '50px',
				threshold: 0
			}
		);

		observer.observe(containerElement);

		return () => {
			observer?.disconnect();
		};
	});
</script>

<div
	bind:this={containerElement}
	class="inline-block align-baseline {class_name || ''}"
	style="width: {width}px; height: {height}px; background-color: transparent;"
>
	{#if isVisible}
		<SparklineDisplay {...props} />
	{:else}
		<!-- Lightweight placeholder that maintains layout -->
		<div
			class="bg-muted/10 inline-block rounded-sm"
			style="width: {width}px; height: {height}px;"
		></div>
	{/if}
</div>
