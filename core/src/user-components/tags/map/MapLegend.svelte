<script lang="ts">
	import type { AreaLayerModel } from './area_layer/AreaLayerModel.svelte';
	import type { PointLayerModel } from './point_layer/PointLayerModel.svelte';
	import { formatValue } from '../../formatValue';
	import formatTitle from '../../formatTitle';

	let {
		layers,
		currentZoom
	}: {
		layers: (AreaLayerModel | PointLayerModel)[];
		currentZoom: number;
	} = $props();

	// Get visible layers based on current zoom
	const visibleLayers = $derived.by(() => {
		return layers.filter((layer) => {
			const props = layer.props;

			// Check if layer wants to show legend
			if (props.legend === false) return false;

			// Only show if layer has been added to map (ensures color scale is cached)
			if (!layer.isAddedToMap) return false;

			// Show if layer has either color scale OR size value (or both)
			const hasColorScale = !!layer.colorScale;
			const hasSizeData = hasSizeValue(layer);
			if (!hasColorScale && !hasSizeData) return false;

			// Check zoom threshold
			if (props.zoom_threshold) {
				const [min, max] = props.zoom_threshold;
				if (currentZoom < min || currentZoom > max) return false;
			}

			return true;
		});
	});

	// Helper to check if a layer is using categorical colors
	function isCategorical(layer: AreaLayerModel | PointLayerModel): boolean {
		return (
			'categoryColors' in layer && layer.categoryColors !== null && layer.categoryColors.size > 0
		);
	}

	// Get the shape for a point layer
	function getLayerShape(layer: AreaLayerModel | PointLayerModel): string {
		// Only point layers have shape property
		if ('shape' in layer.props) {
			return layer.props.shape ?? 'circle';
		}
		return 'circle';
	}

	// Check if layer has size value
	function hasSizeValue(layer: AreaLayerModel | PointLayerModel): boolean {
		return (
			'sizeValueColumn' in layer &&
			layer.sizeValueColumn !== null &&
			layer.minSizeValue !== null &&
			layer.maxSizeValue !== null
		);
	}

	// Track scroll state for each layer to show/hide fade
	let scrollStates = $state<Map<string, boolean>>(new Map());

	function checkScrollPosition(element: HTMLElement | null, layerId: string) {
		if (!element) return;
		const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 1; // 1px threshold
		scrollStates.set(layerId, isAtBottom);
		scrollStates = new Map(scrollStates); // Trigger reactivity
	}

	function handleScroll(e: Event, layerId: string) {
		checkScrollPosition(e.target as HTMLElement, layerId);
	}

	function scrollDetector(element: HTMLElement, layerId: string) {
		// Check initial scroll position
		checkScrollPosition(element, layerId);

		return {
			update(newLayerId: string) {
				checkScrollPosition(element, newLayerId);
			}
		};
	}
</script>

{#if visibleLayers.length > 0}
	<div class="map-legend pointer-events-auto rounded px-2 py-1.5 shadow-sm">
		<div class="flex flex-col gap-1.5">
			{#each visibleLayers as layer (layer.layerId)}
				{@const props = layer.props}
				{@const data = layer.data}
				{@const valueColumn = layer.valueColumn}
				{@const legendLabel = props.legend_label ?? formatTitle(valueColumn)}
				{@const colorScale = layer.colorScale}
				{@const categorical = isCategorical(layer)}

				<div class="flex flex-col gap-0.5">
					{#if colorScale}
						{#if categorical && 'categories' in layer && layer.categories.length > 10}
							<!-- Show count when there are many categories -->
							<div class="flex items-baseline justify-between gap-2">
								<span class="text-[10px] font-semibold text-gray-800 opacity-90 dark:text-white"
									>{legendLabel}</span
								>
								<span class="text-[8px] text-gray-500 dark:text-gray-400"
									>{layer.categories.length} items</span
								>
							</div>
						{:else}
							<span class="text-[10px] font-semibold text-gray-800 opacity-90 dark:text-white"
								>{legendLabel}</span
							>
						{/if}

						{#if categorical && 'categories' in layer && 'categoryColors' in layer}
							<!-- Categorical legend: show color swatches with labels -->
							{@const shape = getLayerShape(layer)}
							{@const isAtBottom = scrollStates.get(layer.layerId) ?? false}
							<div class="categorical-legend-container">
								<div
									class="categorical-legend-items"
									use:scrollDetector={layer.layerId}
									onscroll={(e) => handleScroll(e, layer.layerId)}
								>
									{#each layer.categories as category}
										{@const color = layer.categoryColors?.get(category)}
										{#if color}
											<div class="flex items-center gap-1.5">
												{#if shape === 'circle'}
													<div
														class="h-2.5 w-2.5 shrink-0 rounded-full border-[0.5px] border-white/90 dark:border-black/60"
														style="background-color: {color}"
													></div>
												{:else if shape === 'square'}
													<svg width="12" height="12" viewBox="0 0 64 64" class="shrink-0">
														<rect
															x="12"
															y="12"
															width="40"
															height="40"
															fill={color}
															stroke="rgba(255, 255, 255, 0.9)"
															stroke-width="1"
															rx="2"
															class="dark:stroke-black/60"
														/>
													</svg>
												{:else if shape === 'triangle'}
													<svg width="12" height="12" viewBox="0 0 64 64" class="shrink-0">
														<polygon
															points="32,10 58,54 6,54"
															fill={color}
															stroke="rgba(255, 255, 255, 0.9)"
															stroke-width="1"
															stroke-linejoin="round"
															class="dark:stroke-black/60"
														/>
													</svg>
												{:else if shape === 'star'}
													<svg width="12" height="12" viewBox="0 0 64 64" class="shrink-0">
														<polygon
															points="32,8 37,26 56,26 41,37 46,55 32,44 18,55 23,37 8,26 27,26"
															fill={color}
															stroke="rgba(255, 255, 255, 0.9)"
															stroke-width="1"
															stroke-linejoin="round"
															class="dark:stroke-black/60"
														/>
													</svg>
												{:else if shape === 'diamond'}
													<svg width="12" height="12" viewBox="0 0 64 64" class="shrink-0">
														<polygon
															points="32,8 56,32 32,56 8,32"
															fill={color}
															stroke="rgba(255, 255, 255, 0.9)"
															stroke-width="1"
															stroke-linejoin="round"
															class="dark:stroke-black/60"
														/>
													</svg>
												{:else if shape === 'pin'}
													<svg width="12" height="16" viewBox="0 0 48 64" class="shrink-0">
														<path
															d="M24 0C13.51 0 5 8.51 5 19c0 4.5 1.5 8.64 4.03 12 0 0 13.47 19.5 14.47 21 0.25 0.37 0.65 0.6 1.1 0.6 0.45 0 0.85-0.23 1.1-0.6 1-1.5 14.47-21 14.47-21 2.53-3.36 4.03-7.5 4.03-12C43 8.51 34.49 0 24 0z"
															fill={color}
															stroke="rgba(255, 255, 255, 0.9)"
															stroke-width="1"
															stroke-linejoin="round"
															class="dark:stroke-black/60"
														/>
														<circle cx="24" cy="19" r="6" fill="rgba(255,255,255,0.95)" />
													</svg>
												{/if}
												<span class="text-[9px] leading-none text-gray-700 dark:text-gray-300"
													>{category}</span
												>
											</div>
										{/if}
									{/each}
								</div>
								{#if layer.categories.length > 10 && !isAtBottom}
									<div class="categorical-legend-fade"></div>
								{/if}
							</div>
						{:else}
							<!-- Numeric gradient legend -->
							{@const layerMin = 'minValue' in layer ? layer.minValue : null}
							{@const layerMax = 'maxValue' in layer ? layer.maxValue : null}
							{@const layerMid = 'midpoint' in layer ? layer.midpoint : null}
							{@const layerDomain = 'colorDomain' in layer ? layer.colorDomain : null}
							{@const minValue =
								layerMin ?? Math.min(...data.map((d) => Number(d[valueColumn]) || 0))}
							{@const maxValue =
								layerMax ?? Math.max(...data.map((d) => Number(d[valueColumn]) || 0))}
							{@const valueFmt =
								'color_value_fmt' in props
									? props.color_value_fmt ?? 'num'
									: props.value_fmt ?? 'num'}
							{@const midPercent =
								layerMid !== null && layerMid !== undefined && maxValue > minValue
									? Math.min(
											100,
											Math.max(0, ((layerMid - minValue) / (maxValue - minValue)) * 100)
										)
									: null}
							{@const gradientStops =
								layerDomain && layerDomain.length === colorScale.length && maxValue > minValue
									? colorScale
											.map((c, i) => {
												const pos = ((layerDomain[i] - minValue) / (maxValue - minValue)) * 100;
												return `${c} ${Math.min(100, Math.max(0, pos)).toFixed(2)}%`;
											})
											.join(', ')
									: colorScale.join(', ')}

							<div class="flex items-center gap-1">
								<span class="text-[9px] text-gray-600 dark:text-gray-300"
									>{formatValue(minValue, valueFmt, String(minValue))}</span
								>
								<div class="relative h-2 w-16">
									<div
										class="h-full w-full overflow-hidden rounded-sm"
										style="background: linear-gradient(to right, {gradientStops})"
									></div>
									{#if midPercent !== null}
										<div
											class="absolute top-[-1px] bottom-[-1px] w-px bg-gray-700 dark:bg-gray-200"
											style="left: {midPercent}%"
											title={formatValue(layerMid as number, valueFmt, String(layerMid))}
											aria-hidden="true"
										></div>
									{/if}
								</div>
								<span class="text-[9px] text-gray-600 dark:text-gray-300"
									>{formatValue(maxValue, valueFmt, String(maxValue))}</span
								>
							</div>
						{/if}
					{/if}

					<!-- Size legend (if size_value is provided) -->
					{#if hasSizeValue(layer) && 'sizeValueColumn' in layer && 'minSizeValue' in layer && 'maxSizeValue' in layer}
						{@const shape = getLayerShape(layer)}
						{@const sizeLabel =
							'legend_label' in props && props.legend_label
								? undefined
								: formatTitle(layer.sizeValueColumn ?? 'size')}
						{@const sizeFmt = 'size_value_fmt' in props ? props.size_value_fmt ?? 'num' : 'num'}
						{@const baseSize = 'size' in props ? props.size ?? 6 : 6}
						{@const sizeScale = 'size_scale' in props ? props.size_scale ?? 1 : 1}
						{@const minVal = layer.minSizeValue ?? 0}
						{@const maxVal = layer.maxSizeValue ?? 0}
						{@const minSize = baseSize}
						{@const maxSize = maxVal > minVal ? baseSize + baseSize * sizeScale : baseSize}
						{@const midVal = (minVal + maxVal) / 2}
						{@const midSize =
							maxVal > minVal
								? baseSize + ((midVal - minVal) / (maxVal - minVal)) * baseSize * sizeScale
								: baseSize}

						<div class="flex flex-col gap-0.5" class:mt-1.5={colorScale}>
							{#if sizeLabel}
								<span class="text-[10px] font-semibold text-gray-800 opacity-90 dark:text-white"
									>{sizeLabel}</span
								>
							{/if}
							<div class="flex items-end gap-2">
								<!-- Three size indicators (small, medium, large) aligned at bottom -->
								{#each [{ size: minSize, value: minVal }, { size: midSize, value: midVal }, { size: maxSize, value: maxVal }] as item}
									<div class="flex flex-col items-center gap-0.5">
										{#if shape === 'circle'}
											<div
												class="shrink-0 rounded-full border-[1.2px] border-gray-400 dark:border-gray-500"
												style="width: {item.size * 2}px; height: {item.size * 2}px;"
											></div>
										{:else if shape === 'square'}
											<svg
												width={item.size * 2}
												height={item.size * 2}
												viewBox="0 0 64 64"
												class="shrink-0"
											>
												<rect
													x="12"
													y="12"
													width="40"
													height="40"
													fill="none"
													stroke="#9ca3af"
													stroke-width="1.2"
													vector-effect="non-scaling-stroke"
													rx="2"
													class="dark:stroke-gray-500"
												/>
											</svg>
										{:else if shape === 'triangle'}
											<svg
												width={item.size * 2}
												height={item.size * 2}
												viewBox="0 0 64 64"
												class="shrink-0"
											>
												<polygon
													points="32,10 58,54 6,54"
													fill="none"
													stroke="#9ca3af"
													stroke-width="1.2"
													vector-effect="non-scaling-stroke"
													stroke-linejoin="round"
													class="dark:stroke-gray-500"
												/>
											</svg>
										{:else if shape === 'star'}
											<svg
												width={item.size * 2}
												height={item.size * 2}
												viewBox="0 0 64 64"
												class="shrink-0"
											>
												<polygon
													points="32,8 37,26 56,26 41,37 46,55 32,44 18,55 23,37 8,26 27,26"
													fill="none"
													stroke="#9ca3af"
													stroke-width="1.2"
													vector-effect="non-scaling-stroke"
													stroke-linejoin="round"
													class="dark:stroke-gray-500"
												/>
											</svg>
										{:else if shape === 'diamond'}
											<svg
												width={item.size * 2}
												height={item.size * 2}
												viewBox="0 0 64 64"
												class="shrink-0"
											>
												<polygon
													points="32,8 56,32 32,56 8,32"
													fill="none"
													stroke="#9ca3af"
													stroke-width="1.2"
													vector-effect="non-scaling-stroke"
													stroke-linejoin="round"
													class="dark:stroke-gray-500"
												/>
											</svg>
										{:else if shape === 'pin'}
											<svg
												width={item.size * 2}
												height={item.size * 2 * (4 / 3)}
												viewBox="0 0 48 64"
												class="shrink-0"
											>
												<path
													d="M24 0C13.51 0 5 8.51 5 19c0 4.5 1.5 8.64 4.03 12 0 0 13.47 19.5 14.47 21 0.25 0.37 0.65 0.6 1.1 0.6 0.45 0 0.85-0.23 1.1-0.6 1-1.5 14.47-21 14.47-21 2.53-3.36 4.03-7.5 4.03-12C43 8.51 34.49 0 24 0z"
													fill="none"
													stroke="#9ca3af"
													stroke-width="1.2"
													vector-effect="non-scaling-stroke"
													stroke-linejoin="round"
													class="dark:stroke-gray-500"
												/>
											</svg>
										{/if}
										<span class="text-[8px] text-gray-600 dark:text-gray-300"
											>{formatValue(item.value, sizeFmt, String(item.value))}</span
										>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.map-legend {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .map-legend {
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.categorical-legend-container {
		position: relative;
	}

	.categorical-legend-items {
		display: flex;
		flex-direction: column;
		gap: 0.125rem; /* 2px - very tight spacing */
		max-height: 120px; /* ~10 items at 12px each */
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 2px;
		padding-bottom: 4px; /* Extra space at bottom for fade effect */
	}

	.categorical-legend-fade {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 20px;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.7) 100%
		);
		pointer-events: none;
	}

	:global(.dark) .categorical-legend-fade {
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
	}

	/* Custom scrollbar for categorical legends - matches global app.css pattern */
	.categorical-legend-items::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.categorical-legend-items::-webkit-scrollbar-track {
		background: transparent;
	}

	.categorical-legend-items::-webkit-scrollbar-thumb {
		background: rgba(100, 100, 100, 0.4);
		border-radius: 6px;
		transition: background 0.2s ease;
	}

	.categorical-legend-items::-webkit-scrollbar-thumb:hover {
		background: rgba(100, 100, 100, 0.7);
	}

	.categorical-legend-items:not(:hover)::-webkit-scrollbar-thumb {
		background: transparent;
	}

	/* Firefox scrollbar */
	.categorical-legend-items {
		scrollbar-width: thin;
		scrollbar-color: rgba(100, 100, 100, 0.4) transparent;
	}
</style>
