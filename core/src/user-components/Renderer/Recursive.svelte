<script module lang="ts">
	const VOID_ELEMENTS = new Set([
		'area',
		'base',
		'br',
		'col',
		'embed',
		'hr',
		'img',
		'input',
		'link',
		'meta',
		'source',
		'track',
		'wbr'
	]);
</script>

<script lang="ts">
	import { isUserComponent } from '../../index';
	import Recursive from './Recursive.svelte';
	import Markdoc, { type Tag, type RenderableTreeNode, type ValidateError } from '@markdoc/markdoc';
	import { setNodeContext } from './node-context';
	import UserComponent from '../UserComponent.svelte';
	import ReactiveVariable from './ReactiveVariable.svelte';
	import { getComponentClickToSourceContext } from '../../component-click-to-source.context.svelte';
	import { page } from '../../shims/page-state';

	export type Props = {
		treeNode: RenderableTreeNode;
		validationErrors: ValidateError[];
	};

	const { treeNode, validationErrors }: Props = $props();

	setNodeContext(treeNode);

	const clickToSourceContext = getComponentClickToSourceContext();
	const isEditRoute = $derived(page.route.id?.includes('/edit'));

	function stableChildKeys(children: RenderableTreeNode[]): (string | number)[] {
		const counters = new Map<string, number>();
		return children.map((child, i) => {
			if (Markdoc.Tag.isTag(child)) {
				const n = counters.get(child.name) ?? 0;
				counters.set(child.name, n + 1);
				return `${child.name}-${n}`;
			}
			return i;
		});
	}

	function handleMarkdownClick(event: MouseEvent, tag: Tag) {
		if (!isEditRoute || !clickToSourceContext) return;
		if (!(event.metaKey || event.ctrlKey)) return;
		event.stopPropagation();

		if (tag.lines && tag.lines.length >= 2) {
			const startLine = tag.lines[0] + 1;
			const endLine = tag.lines.length === 4 ? tag.lines[3] : tag.lines[1];
			clickToSourceContext.scrollToLineRange(startLine, endLine);
		} else if (tag.location?.start?.line !== undefined) {
			clickToSourceContext.scrollToLine(tag.location.start.line + 1);
		}
	}
</script>

{#snippet tagChildren(tag: Tag)}
	{@const childKeys = stableChildKeys(tag.children)}
	{#each tag.children as child, i (childKeys[i])}
		<Recursive treeNode={child} {validationErrors} />
	{/each}
{/snippet}

{#if Markdoc.Tag.isTag(treeNode)}
	{#if treeNode.name === 'ReactiveVariable'}
		<!-- Internal component: Handle ReactiveVariable specially without going through UserComponent wrapper -->
		<ReactiveVariable expression={treeNode.attributes.expression} />
	{:else if treeNode.name === 'html_table'}
		<!-- Native HTML table from markdown. `data-md-table` marks it as a GFM
			 markdown table (vs. a `{% table %}` data component's <table>) so chat/
			 insight surfaces can scope horizontal-overflow handling to it alone. -->
		<table data-md-table {...treeNode.attributes}>
			{@render tagChildren(treeNode)}
		</table>
	{:else if isUserComponent(treeNode.name)}
		<UserComponent tag={treeNode} allValidationErrors={validationErrors}>
			{@render tagChildren(treeNode)}
		</UserComponent>
	{:else if VOID_ELEMENTS.has(treeNode.name)}
		<svelte:element
			this={treeNode.name}
			{...treeNode.attributes}
			onclick={(e: MouseEvent) => handleMarkdownClick(e, treeNode)}
		/>
	{:else}
		<svelte:element
			this={treeNode.name}
			{...treeNode.attributes}
			onclick={(e: MouseEvent) => handleMarkdownClick(e, treeNode)}
		>
			{@render tagChildren(treeNode)}
		</svelte:element>
	{/if}
{:else}
	{treeNode}
{/if}
