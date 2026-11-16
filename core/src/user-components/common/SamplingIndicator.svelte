<script lang="ts">
	import Info from 'lucide-svelte/icons/info';
	import * as Tooltip from '../../shadcn/components/ui/tooltip';
	import { getLocaleContext } from '../../locale/locale.context.svelte';
	const localeContext = getLocaleContext();
	const { t } = localeContext;
	const numberLocale = $derived(
		localeContext.resolvedLanguage === 'en' ? undefined : localeContext.resolvedLanguage
	);

	type Props = {
		isSampled: boolean;
		dataLength: number;
		totalCount?: number;
		inline?: boolean;
	};

	const { isSampled, dataLength, totalCount, inline = false }: Props = $props();

	const samplingPercentage: string | undefined = $derived.by(() => {
		if (!totalCount || totalCount === 0) return;

		const percentage = (dataLength / totalCount) * 100;
		if (percentage < 10) {
			return numberLocale
				? percentage.toLocaleString(numberLocale, {
						minimumFractionDigits: 1,
						maximumFractionDigits: 1
					})
				: percentage.toFixed(1);
		}
		return Math.round(percentage).toString();
	});

	const formattedDataLength = $derived(dataLength.toLocaleString(numberLocale));
	const formattedTotalCount = $derived(totalCount?.toLocaleString(numberLocale));
</script>

{#if isSampled}
	<Tooltip.Root>
		<Tooltip.Trigger class={inline ? 'inline-flex' : 'absolute top-0.5 right-0'}>
			<div class="bg-background rounded-sm p-0.5">
				<Info class="text-muted-foreground/60 h-3.5 w-3.5" />
			</div>
		</Tooltip.Trigger>
		<Tooltip.Content
			class="bg-background text-foreground w-44 rounded-md border p-1.5 text-[10px] shadow-md"
		>
			{#if typeof samplingPercentage !== 'undefined' && typeof formattedTotalCount !== 'undefined'}
				{t('sampling.points_of_total', {
					pct: samplingPercentage,
					shown: formattedDataLength,
					total: formattedTotalCount
				})}
			{:else}
				{t('sampling.points', { shown: formattedDataLength })}
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
