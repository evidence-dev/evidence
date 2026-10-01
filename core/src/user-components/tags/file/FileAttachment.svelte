<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { getAssetDeliveryContext } from '../../common/asset-delivery-context';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { sanitizeUrl } from '../../common/transform-internal-link';
	import {
		expandFileUrl,
		fileNameFromUrl,
		formatFileDate,
		inferFileIconKind,
		inferFileTypeLabel,
		isFileAlias
	} from './file-meta';
	import Download from 'lucide-svelte/icons/download';
	import FileIcon from 'lucide-svelte/icons/file';
	import FileText from 'lucide-svelte/icons/file-text';
	import FileSpreadsheet from 'lucide-svelte/icons/file-spreadsheet';
	import Presentation from 'lucide-svelte/icons/presentation';
	import FileImage from 'lucide-svelte/icons/file-image';
	import FileArchive from 'lucide-svelte/icons/file-archive';
	import FileCode from 'lucide-svelte/icons/file-code';

	let props: UserComponentProps<typeof schema> = $props();

	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
	const inlineQueries = getInlineQueriesContext();
	// Only set in embedded reports, where the download URL needs the embed token instead of a cookie.
	const assetDelivery = getAssetDeliveryContext();

	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText } = $derived(createResolvers(variableProcessor));

	const rawUrl = $derived(resolveText(props.url) ?? props.url);
	const name = $derived(resolveText(props.name)?.trim() || fileNameFromUrl(rawUrl));
	const typeLabel = $derived(
		inferFileTypeLabel({ type: resolveText(props.type)?.trim(), name, url: rawUrl })
	);
	const dateLabel = $derived(formatFileDate(resolveText(props.date)));
	const iconKind = $derived(inferFileIconKind({ name, url: rawUrl }));

	const isUpload = $derived(isFileAlias(rawUrl));
	const href = $derived.by(() => {
		if (isUpload) {
			const proxied = expandFileUrl(rawUrl, name) ?? '';
			return assetDelivery ? assetDelivery.authorize(proxied) : proxied;
		}
		return sanitizeUrl(rawUrl);
	});

	const icons = {
		document: FileText,
		spreadsheet: FileSpreadsheet,
		presentation: Presentation,
		image: FileImage,
		archive: FileArchive,
		code: FileCode,
		generic: FileIcon
	} as const;
	const Icon = $derived(icons[iconKind]);

	const ariaLabel = $derived(
		[isUpload ? 'Download' : 'Open', name, typeLabel, dateLabel].filter(Boolean).join(', ')
	);
</script>

<a
	{href}
	download={isUpload ? name : undefined}
	target={isUpload ? undefined : '_blank'}
	rel={isUpload ? undefined : 'noopener noreferrer'}
	aria-label={ariaLabel}
	class="group border-border bg-card text-card-foreground hover:bg-muted/50 inline-flex max-w-md items-center gap-3 rounded-lg border px-3 py-2.5 no-underline transition-colors [:is([data-render=row],[data-render=stack])_&]:w-0 [:is([data-render=row],[data-render=stack])_&]:max-w-none [:is([data-render=row],[data-render=stack])_&]:min-w-full"
>
	<div
		class="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md"
	>
		<Icon class="size-5" aria-hidden="true" />
	</div>
	<div class="min-w-0 flex-1 text-left">
		<div class="text-foreground truncate text-sm font-medium" title={name}>{name}</div>
		{#if typeLabel || dateLabel}
			<div class="text-muted-foreground flex items-center gap-1.5 text-xs">
				{#if typeLabel}<span>{typeLabel}</span>{/if}
				{#if typeLabel && dateLabel}<span aria-hidden="true">·</span>{/if}
				{#if dateLabel}<time>{dateLabel}</time>{/if}
			</div>
		{/if}
	</div>
	<Download
		class="text-muted-foreground size-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
		aria-hidden="true"
	/>
</a>
