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

	// Page-level theme (project theme.yaml + home.md frontmatter `theme`), scoped
	// under the layout's project-theme context exactly as [...path] does. When
	// there's no home file, fall through to the layout's project theme.
	const themeContext = setThemeContext(data.resolvedPageTheme ?? data.resolvedTheme);
	$effect(() => themeContext.updateConfig(data.resolvedPageTheme ?? data.resolvedTheme));
	const themeCSS = $derived(data.resolvedPageTheme ? generateThemeCSS(data.resolvedPageTheme) : '');

	const tree = $derived(data.markdown ? deserializeTree(data.markdown.serializedTree) : null);

	const fullscreen = $derived(page.url.searchParams.get('fullscreen') !== null);

	const pageSettings = $derived(data.markdown?.pageSettings ?? {});
	const cards = $derived(pageSettings.cards ?? false);
	// 'full' spans the viewport (like fullscreen); 'article'/default is a narrow column.
	const widthClass = $derived(
		fullscreen || pageSettings.page_width === 'full' ? '' : 'max-w-[64rem]'
	);
</script>

<svelte:head>
	<title
		>Evidence{(data.markdown?.title ?? data.markdown?.fileName)
			? ` - ${data.markdown.title ?? data.markdown.fileName}`
			: ''}</title
	>
	<meta name="description" content="Evidence Studio local development" />
	{#if themeCSS}
		<!-- Emitted after the layout's :root theme, so a page frontmatter theme wins by cascade -->
		{@html `<style>${themeCSS}</style>`}
	{/if}
</svelte:head>

{#if cards}
	{@html `<style>body { background-color: var(--card-mode-background) !important; }</style>`}
{/if}

<div class="min-h-full {cards ? 'bg-card-mode-background' : 'bg-background'}">
	<div class="mx-auto p-4 {widthClass}">
		{#if tree && (data.organizationId || data.hasLocalConnection)}
			<!-- Queries run via managed engine (organizationId) or local connection.yaml -->
			<CLIPageWrapper
				organizationId={data.organizationId ?? ''}
				connectionType={data.connectionType}
				serializedInlineQueries={data.markdown?.serializedInlineQueries}
				serializedFilters={data.markdown?.serializedFilters}
				sqlFiles={data.markdown?.sqlFiles}
				basePath={data.markdown?.basePath}
				useRelativeResolution={data.markdown?.useRelativeResolution}
				metricFiles={data.metricFiles}
				{pageSettings}
				projectSettings={data.projectSettings}
			>
				<PeriodPicker class="mb-4" />
				<div
					class="prose select-text dark:prose-invert prose-code:before:content-none prose-code:after:content-none"
				>
					<Renderer {tree} validationErrors={data.markdown?.validationErrors ?? []} />
				</div>
			</CLIPageWrapper>
		{:else if tree}
			<!-- Not logged in and no local connection - render without query support -->
			<div
				class="prose select-text dark:prose-invert prose-code:before:content-none prose-code:after:content-none"
			>
				<Renderer {tree} validationErrors={data.markdown?.validationErrors ?? []} />
			</div>
			<div class="mt-8 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
				<p>
					<strong>Note:</strong> To enable queries, add a
					<code class="rounded bg-background px-1">connection.yaml</code> to query your own
					database, or run
					<code class="rounded bg-background px-1">evidence login</code> to use the hosted Evidence Warehouse.
				</p>
			</div>
		{:else}
			<div class="py-16 text-center">
				<h1 class="text-xl font-semibold">No content found</h1>
				<p class="mt-2 text-muted-foreground">
					Create a <code class="rounded bg-muted px-1">pages/home.md</code> file to get started.
				</p>
				<pre
					class="mt-6 overflow-x-auto rounded-lg bg-card p-4 text-left text-sm text-card-foreground"><code
						># Welcome

This is my Evidence project.

```sql orders
select 1 as id, 'test' as name
```

{`{% big_value data="orders" value="id" /%}`}
</code></pre>
			</div>
		{/if}
	</div>
</div>
