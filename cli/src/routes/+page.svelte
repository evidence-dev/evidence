<script lang="ts">
	import type { PageData } from './$types';
	import { Renderer, deserializeTree } from '$lib/markdown';
	import CLIPageWrapper from '$lib/components/CLIPageWrapper.svelte';
	import PeriodPicker from '@evidence/core/viewer-components/PeriodPicker.svelte';
	import { page } from '$app/state';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const tree = $derived(data.markdown ? deserializeTree(data.markdown.serializedTree) : null);

	const fullscreen = $derived(page.url.searchParams.get('fullscreen') !== null);
</script>

<svelte:head>
	<title>Evidence{data.markdown?.title ?? data.markdown?.fileName ? ` - ${data.markdown.title ?? data.markdown.fileName}` : ''}</title>
	<meta name="description" content="Evidence Studio local development" />
</svelte:head>

<div class="mx-auto p-4 {fullscreen ? '' : 'max-w-[64rem]'}">
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
		>
			<PeriodPicker class="mb-4" />
			<div
				class="prose dark:prose-invert prose-code:before:content-none prose-code:after:content-none select-text"
			>
				<Renderer {tree} validationErrors={data.markdown?.validationErrors ?? []} />
			</div>
		</CLIPageWrapper>
	{:else if tree}
		<!-- Not logged in and no local connection - render without query support -->
		<div
			class="prose dark:prose-invert prose-code:before:content-none prose-code:after:content-none select-text"
		>
			<Renderer {tree} validationErrors={data.markdown?.validationErrors ?? []} />
		</div>
		<div class="bg-muted text-muted-foreground mt-8 rounded-lg p-4 text-sm">
			<p>
				<strong>Note:</strong> To enable queries, add a
				<code class="bg-background rounded px-1">connection.yaml</code> to query your own database,
				or run
				<code class="bg-background rounded px-1">evidence login</code> to use the hosted Evidence Warehouse.
			</p>
		</div>
	{:else}
		<div class="py-16 text-center">
			<h1 class="text-xl font-semibold">No content found</h1>
			<p class="text-muted-foreground mt-2">
				Create a <code class="bg-muted rounded px-1">pages/home.md</code> file to get started.
			</p>
			<pre
				class="bg-card text-card-foreground mt-6 overflow-x-auto rounded-lg p-4 text-left text-sm"><code
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
