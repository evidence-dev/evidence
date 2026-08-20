<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { formatValue } from '../../formatValue';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { HeatGridModel } from './HeatGridModel.svelte';
	import { getModelContext } from '../../model-context.svelte';
	import { coerceBoolean } from '../../common/process-variables';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import chroma from 'chroma-js';

	type Props = UserComponentProps<typeof schema>;
	const _props: Props = $props();

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	const model = getModelContext({ expected: HeatGridModel });
	const query = $derived(model.query);
	const loading = $derived(query.loading);
	const rows = $derived(query.result?.rows ?? []);
	const error = $derived(query.error);

	const title = $derived(model.resolvedTitle);
	const units = $derived(model.resolvedUnits);
	const fmt = $derived(model.resolvedFmt);
	const thresholds = $derived(model.attributes.thresholds as [number, number]);
	const lowerIsBetter = $derived(coerceBoolean(model.attributes.lower_is_better) ?? false);
	const compact = $derived(coerceBoolean(model.attributes.compact) ?? false);

	const dimensionAlias = $derived(model.dimensionProcessed.alias);
	const valueAlias = $derived(model.valueProcessed.alias);

	// Colors: [below low threshold, between thresholds, above high threshold]
	// When lower_is_better: green for low, yellow for mid, red for high
	// When !lower_is_better (default): red for low, yellow for mid, green for high
	const COLORS_LOWER_GOOD = ['#22c55e', '#eab308', '#ef4444'];
	const COLORS_HIGHER_GOOD = ['#ef4444', '#eab308', '#22c55e'];

	const zoneColors = $derived(lowerIsBetter ? COLORS_LOWER_GOOD : COLORS_HIGHER_GOOD);

	function getZoneColor(value: number): string {
		if (value < thresholds[0]) return zoneColors[0];
		if (value < thresholds[1]) return zoneColors[1];
		return zoneColors[2];
	}

	$effect(() => {
		setError(error ?? undefined);
	});

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'heat_grid', query, title);
	});

	setupRenderReadiness('heat_grid', () => !loading);

	let containerWidth = $state(0);
	const MIN_CELL_WIDTH = 100;
	const gap = $derived(compact ? 0 : 8);
	const cols = $derived(
		Math.min(
			rows.length || 1,
			Math.max(1, Math.floor((containerWidth + gap) / (MIN_CELL_WIDTH + gap)))
		)
	);
</script>

{#if title}
	<ComponentTitle {title} subtitle={undefined} />
{/if}

{#if loading}
	<div class="flex items-center justify-center py-8">
		<LoaderCircle class="text-muted-foreground h-5 w-5 animate-spin [animation-duration:1s]" />
	</div>
{:else}
	<div
		bind:clientWidth={containerWidth}
		class="grid"
		class:gap-2={!compact}
		class:overflow-hidden={compact}
		class:rounded-lg={compact}
		style="grid-template-columns: repeat({cols}, 1fr);"
	>
		{#each rows as row}
			{@const dimensionValue = row[dimensionAlias]}
			{@const metricValue = Number(row[valueAlias])}
			{@const zoneColor = getZoneColor(metricValue)}
			<div
				class="@container flex flex-col items-center justify-center overflow-hidden px-4 py-3"
				class:rounded-lg={!compact}
				class:border={!compact}
				style="background-color: {chroma(zoneColor).alpha(0.15).css()};{!compact
					? ` border-color: ${chroma(zoneColor).alpha(0.5).css()};`
					: ''}"
			>
				<span class="text-muted-foreground truncate text-xs font-medium">{dimensionValue}</span>
				<span
					class="font-bold whitespace-nowrap"
					style="color: {chroma(zoneColor)
						.darken(1)
						.saturate(2)
						.hex()}; font-size: clamp(0.875rem, 8cqw, 1.25rem);"
					>{formatValue(metricValue, fmt)}</span
				>
				{#if units}
					<span class="text-muted-foreground text-xs font-medium">{units}</span>
				{/if}
			</div>
		{/each}
	</div>

	<div class="text-muted-foreground mt-3 flex items-center justify-center gap-4 text-xs">
		<div class="flex items-center gap-1.5">
			<span
				class="inline-block h-3 w-3 rounded border"
				style="background-color: {chroma(zoneColors[0])
					.alpha(0.15)
					.css()}; border-color: {zoneColors[0]};"
			></span>
			<span>&lt; {formatValue(thresholds[0], fmt)}{units ? ' ' + units : ''}</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span
				class="inline-block h-3 w-3 rounded border"
				style="background-color: {chroma(zoneColors[1])
					.alpha(0.15)
					.css()}; border-color: {zoneColors[1]};"
			></span>
			<span
				>{formatValue(thresholds[0], fmt)}–{formatValue(thresholds[1], fmt)}{units
					? ' ' + units
					: ''}</span
			>
		</div>
		<div class="flex items-center gap-1.5">
			<span
				class="inline-block h-3 w-3 rounded border"
				style="background-color: {chroma(zoneColors[2])
					.alpha(0.15)
					.css()}; border-color: {zoneColors[2]};"
			></span>
			<span>&gt; {formatValue(thresholds[1], fmt)}{units ? ' ' + units : ''}</span>
		</div>
	</div>
{/if}
