<script lang="ts">
	import type { PageData } from './$types';
	import { Renderer, deserializeTree } from '$lib/markdown';
	import CLIPageWrapper from '$lib/components/CLIPageWrapper.svelte';
	import PeriodPicker from '@evidence/core/viewer-components/PeriodPicker.svelte';
	import { page } from '$app/state';
	import { generateThemeCSS } from '@evidence/core/theme/theme-css-helper';
	import { setThemeContext } from '@evidence/core/theme/theme.context.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Page-level theme = project theme.yaml + this page's frontmatter `theme` block.
	// Nested under the layout's context, so the report uses the page theme while the
	// surrounding chrome keeps the project theme. The $effect keeps it in sync with
	// the dev poll's invalidateAll (which re-runs load without remounting).
	const themeContext = setThemeContext(data.resolvedPageTheme);
	$effect(() => themeContext.updateConfig(data.resolvedPageTheme));
	const themeCSS = $derived(generateThemeCSS(data.resolvedPageTheme));

	const tree = $derived(deserializeTree(data.markdown.serializedTree));

	const fullscreen = $derived(page.url.searchParams.get('fullscreen') !== null);

	const pageSettings = $derived(data.markdown.pageSettings ?? {});
	const cards = $derived(pageSettings.cards ?? false);
	// 'full' spans the viewport (like fullscreen); 'article'/default is a narrow column.
	const widthClass = $derived(
		fullscreen || pageSettings.page_width === 'full' ? '' : 'max-w-[64rem]'
	);
</script>

<svelte:head>
	<title>Evidence - {data.markdown.title ?? data.markdown.fileName}</title>
	<meta name="description" content="Evidence Studio local development" />
	<!-- Emitted after the layout's :root theme, so a page frontmatter theme wins by cascade -->
	{@html `<style>${themeCSS}</style>`}
</svelte:head>

<!-- In card mode the page gutter uses the card-mode background so cards stand out.
	 Injected in the body (not <svelte:head>) so it's torn down on client-side
	 navigation — a head {@html} style would leak into pages that don't use cards. -->
{#if cards}
	{@html `<style>body { background-color: var(--card-mode-background) !important; }</style>`}
{/if}

<div class="min-h-full {cards ? 'bg-card-mode-background' : 'bg-background'}">
	<div class="mx-auto p-4 {widthClass}">
		{#if data.organizationId || data.hasLocalConnection}
			<!-- Queries run via managed engine (organizationId) or local connection.yaml -->
			<CLIPageWrapper
				organizationId={data.organizationId ?? ''}
				connectionType={data.connectionType}
				serializedInlineQueries={data.markdown.serializedInlineQueries}
				serializedFilters={data.markdown.serializedFilters}
				sqlFiles={data.markdown.sqlFiles}
				basePath={data.markdown.basePath}
				useRelativeResolution={data.markdown.useRelativeResolution}
				metricFiles={data.metricFiles}
				{pageSettings}
				projectSettings={data.projectSettings}
			>
				<PeriodPicker class="mb-4" />
				<div
					class="prose dark:prose-invert prose-code:before:content-none prose-code:after:content-none select-text"
				>
					<Renderer {tree} validationErrors={data.markdown.validationErrors} />
				</div>
			</CLIPageWrapper>
		{:else}
			<!-- Not logged in and no local connection - render without query support -->
			<div
				class="prose dark:prose-invert prose-code:before:content-none prose-code:after:content-none select-text"
			>
				<Renderer {tree} validationErrors={data.markdown.validationErrors} />
			</div>
			<div class="bg-muted text-muted-foreground mt-8 rounded-lg p-4 text-sm">
				<p>
					<strong>Note:</strong> To enable queries, add a
					<code class="bg-background rounded px-1">connection.yaml</code> to query your own
					database, or run
					<code class="bg-background rounded px-1">evidence login</code> to use the hosted Evidence Warehouse.
				</p>
			</div>
		{/if}
	</div>
</div>
