<script>
	/* global globalThis */
	import { BlockingDagNode, PassiveDagNode } from '@evidence-dev/sdk/utils';
	import { getContext } from 'svelte';
	import { Anchor, Node } from 'svelvet';

	export let title;
	export let nodeClass;
	/** @type {import("@evidence-dev/sdk/utils").DagNode} */
	export let dagNode;

	$: nodeId = dagNode.mermaidId;

	const { graph, selectEpoch, selectedEpoch, selectAncestor, selectedAncestor } =
		getContext('graphContext');
	$: graphNode = $graph.node(nodeId);

	$: isSelectedEpoch = $selectedEpoch ? $selectedEpoch === $dagNode?.latestEpochId : true;
	$: isSelectedAncestor = $selectedAncestor ? $dagNode?.hasAncestor($selectedAncestor) : true;
</script>

{#if graphNode && !dagNode.hidden}
	<Node
		id={nodeId}
		dynamic
		editable={false}
		position={{ x: graphNode.x, y: graphNode.y }}
		dimensions={{ height: graphNode.height, width: graphNode.width }}
	>
		<section
			class="p-2 {nodeClass} border-4 h-full w-full flex flex-col"
			class:opacity-50={!isSelectedEpoch || !isSelectedAncestor}
			class:border-red-500={$dagNode?.dirty}
		>
			<header class="text-lg font-bold">{title}</header>
			<dl class="mb-2">
				<slot name="info">
					<dt>Name</dt>
					<dd class="ml-4 font-bold">{nodeId}</dd>
				</slot>
				<dt>Dirty</dt>
				<dd class="ml-4 font-bold">
					{$dagNode?.dirty}
				</dd>
				<dt>Last Updated Epoch</dt>
				<dd class="ml-4 font-bold">
					{$dagNode?.latestEpochId?.description}
				</dd>
			</dl>
			<div class="flex flex-col gap-1 flex-1 justify-end">
				<button
					on:click={() => selectEpoch($dagNode?.latestEpochId)}
					class="text-sm font-normal px-1 py-1/2 border border-black rounded"
					class:bg-yellow-300={$selectedEpoch && isSelectedEpoch}
				>
					Highlight Epoch
				</button>
				<button
					on:click={() => selectAncestor($dagNode)}
					class="text-sm font-normal px-1 py-1/2 border border-black rounded"
					class:bg-yellow-300={$selectedAncestor && isSelectedAncestor}
				>
					Highlight Dependencies
				</button>
				<button
					on:click={() => {
						globalThis.debugDagNode = $dagNode;
					}}
					class="text-sm font-normal px-1 py-1/2 border border-black rounded"
				>
					Set on window
				</button>
				{#if $dagNode instanceof BlockingDagNode}
					<button
						on:click={() => $dagNode.unblock()}
						class="text-sm font-normal px-1 py-1/2 border border-black rounded"
						disabled={!$dagNode.dirty}
					>
						Unblock
					</button>
				{/if}
				{#if $dagNode instanceof PassiveDagNode}
					<button
						on:click={() => $dagNode.trigger()}
						class="text-sm font-normal px-1 py-1/2 border border-black rounded"
					>
						Trigger
					</button>
				{/if}
			</div>
		</section>

		{#each $dagNode?.parents ?? [] as parent (parent.mermaidId)}
			{#if !parent.hidden}
				<Anchor
					locked
					dynamic
					id="input-{parent.mermaidId}"
					connections={[[parent.mermaidId, 'output-' + nodeId]]}
					input
				/>
			{/if}
		{/each}
		{#each $dagNode?.children ?? [] as child (child.mermaidId)}
			{#if !child.hidden}
				<Anchor
					locked
					dynamic
					id="output-{child.mermaidId}"
					connections={[[nodeId, 'input-' + child.mermaidId]]}
					output
				/>
			{/if}
		{/each}
	</Node>
{/if}
