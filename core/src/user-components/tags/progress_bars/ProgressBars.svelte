<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { formatValue } from '../../formatValue';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { ProgressBarsModel } from './ProgressBarsModel.svelte';
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

	const model = getModelContext({ expected: ProgressBarsModel });
	const query = $derived(model.query);
	const loading = $derived(query.loading);
	const rows = $derived(query.result?.rows ?? []);
	const error = $derived(query.error);

	const title = $derived(model.resolvedTitle);
	const fmt = $derived(model.resolvedFmt);

	const dimensionAlias = $derived(model.dimensionProcessed.alias);
	const numeratorAlias = $derived(model.numeratorProcessed.alias);
	const denominatorAlias = $derived(model.denominatorProcessed.alias);

	const thresholds = $derived(model.attributes.thresholds as [number, number] | undefined);
	const colors = $derived(model.attributes.colors as [string, string] | undefined);
	const colorScale = $derived(
		colors ? chroma.scale(colors).domain([0, 1]).mode('lrgb') : undefined
	);

	const lowerIsBetter = $derived(coerceBoolean(model.attributes.lower_is_better) ?? false);

	const ZONE_COLORS_HIGHER_GOOD = ['#ef4444', '#eab308', '#22c55e'];
	const ZONE_COLORS_LOWER_GOOD = ['#22c55e', '#eab308', '#ef4444'];
	const zoneColors = $derived(lowerIsBetter ? ZONE_COLORS_LOWER_GOOD : ZONE_COLORS_HIGHER_GOOD);

	function getBarColor(pct: number): string | null {
		if (thresholds) {
			if (pct < thresholds[0]) return zoneColors[0];
			if (pct < thresholds[1]) return zoneColors[1];
			return zoneColors[2];
		}
		if (colorScale) {
			return colorScale(Math.max(0, Math.min(1, pct))).hex();
		}
		return null;
	}

	$effect(() => {
		setError(error ?? undefined);
	});

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'progress_bars', query, title);
	});

	setupRenderReadiness('progress_bars', () => !loading);
</script>

{#if title}
	<ComponentTitle {title} subtitle={undefined} />
{/if}

{#if loading}
	<div class="flex items-center justify-center py-8">
		<LoaderCircle class="text-muted-foreground h-5 w-5 animate-spin [animation-duration:1s]" />
	</div>
{:else}
	<div class="flex flex-col gap-4">
		{#each rows as row}
			{@const label = row[dimensionAlias]}
			{@const num = Number(row[numeratorAlias]) || 0}
			{@const den = Number(row[denominatorAlias]) || 0}
			{@const pct = den > 0 ? num / den : 0}
			{@const barColor = getBarColor(pct)}
			{@const pctClamped = Math.min(pct, 1)}
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<span class="text-foreground text-sm font-medium">{label}</span>
					<span class="flex items-center text-xs tabular-nums">
						<span class="text-foreground">{formatValue(num, fmt)}</span>
						<span class="text-muted-foreground">&nbsp;/&nbsp;{formatValue(den, fmt)}</span>
						{#if barColor}
							<span
								class="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
								style="background-color: {chroma(barColor).alpha(0.15).css()}; color: {chroma(
									barColor
								)
									.darken(1)
									.saturate(2)
									.hex()};"
							>
								{Math.round(pct * 100)}%
							</span>
						{:else}
							<span
								class="bg-foreground/10 text-foreground ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
							>
								{Math.round(pct * 100)}%
							</span>
						{/if}
					</span>
				</div>
				<div class="relative">
					<div class="bg-muted h-2 w-full overflow-hidden rounded-full">
						{#if barColor}
							<div
								class="h-full rounded-full transition-all duration-300"
								style="width: {Math.max(pctClamped * 100, 1)}%; background-color: {chroma(barColor)
									.alpha(0.7)
									.css()};"
							></div>
						{:else}
							<div
								class="bg-foreground/70 h-full rounded-full transition-all duration-300"
								style="width: {Math.max(pctClamped * 100, 1)}%;"
							></div>
						{/if}
					</div>
					{#if thresholds}
						<div
							class="bg-foreground/15 pointer-events-none absolute top-0 h-full"
							style="left: {thresholds[0] * 100}%; width: 1px;"
						></div>
						<div
							class="bg-foreground/15 pointer-events-none absolute top-0 h-full"
							style="left: {thresholds[1] * 100}%; width: 1px;"
						></div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
