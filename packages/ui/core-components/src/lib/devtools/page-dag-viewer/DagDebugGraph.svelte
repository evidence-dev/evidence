<script>
	import { Background, Controls, Node, Svelvet } from 'svelvet';
	import QueryNode from './QueryNode.svelte';
	import InputNode from './InputNode.svelte';
	import DagDebugNode from './DagDebugNode.svelte';
	import { buildLayout } from './buildLayout.js';
	import { Query } from '@evidence-dev/sdk/usql';
	import { DagNode, Input, InputStore } from '@evidence-dev/sdk/utils';

	import { setContext } from 'svelte';
	import { readonly, writable } from 'svelte/store';

	/** @type {import("@evidence-dev/sdk/utils").WithDag[]} */
	export let rootNodes = [];

	const reduceNodes = (nodes) => {
		// This is done as a 2 step process because we want to traverse
		// hidden nodes, but then we want to filter them out so they don't
		// appear in the final rendering.

		// The original use-case here is Inputs that are on the page, but aren't
		// directly used in any queries - relevant because there are scenarios where
		// the DAG isn't able to track yet
		const nodeSet = nodes.reduce((a, v) => {
			const discovered = new Set();
			/** @param {import("@evidence-dev/sdk/utils").DagNode} n*/
			const recursive = (n) => {
				if (discovered.has(n)) return;
				if (!DagNode.isDagNode(n)) return;
				discovered.add(n);
				n.children.forEach((child) => recursive(child));
				n.parents.forEach((parent) => recursive(parent));
				a.add(n);
			};
			recursive(v.__dag);
			if (DagNode.isDagNode(v.__dag)) {
				a.add(v.__dag);
			}

			return a;
		}, new Set());
		return Array.from(nodeSet).filter((a) => !a.hidden);
	};
	let allNodes = [...reduceNodes(rootNodes)];
	$: allNodes = [...reduceNodes(rootNodes)];

	/** @type {import("svelte/store").Writable<undefined | Symbol>}*/
	const selectedEpoch = writable(undefined);
	/** @type {import("svelte/store").Writable<undefined | DagNode>}*/
	const selectedAncestor = writable(undefined);

	let graph = writable(buildLayout(allNodes));
	$: $graph = buildLayout(allNodes);
	const graphContext = {
		graph: readonly(graph),
		/** @param {Symbol} epochId */
		selectEpoch: (epochId) => {
			if (typeof epochId !== 'symbol') return;
			if ($selectedEpoch === epochId) {
				$selectedEpoch = undefined;
				return;
			}
			$selectedEpoch = epochId;
		},
		selectedEpoch: readonly(selectedEpoch),
		/** @param {DagNode} node */
		selectAncestor: (node) => {
			if ($selectedAncestor === node) {
				$selectedAncestor = undefined;
				return;
			}
			$selectedAncestor = node;
		},
		selectedAncestor: readonly(selectedAncestor)
	};

	setContext('graphContext', graphContext);
</script>

{#if allNodes.length}
	<Svelvet
		editable={false}
		height={1080}
		fitView
		endStyles={['arrow', null]}
		controls={false}
		edgeStyle="straight"
	>
		<Background gridWidth={40} dotSize={3} slot="background" />
		<Controls slot="controls">
			<!-- Contains display information -->
			<div class="font-sans">
				Selected Epoch: {$selectedEpoch?.description ?? 'None'}
			</div>
		</Controls>
		{#each allNodes as node (node.name)}
			{#if Query.isQuery(node.container)}
				<QueryNode query={node.container} dagNode={node} />
			{:else if Input.isInput(node.container)}
				<InputNode input={node.container} />
			{:else if InputStore.isInputStore(node.container)}
				<DagDebugNode title={node.name} dagNode={node} nodeClass="bg-gray-100" />
			{:else if typeof node.container === 'undefined' || node.container === null}
				<DagDebugNode title="No-Op Node" dagNode={node} nodeClass="bg-gray-100" />
			{:else}
				<Node title="Unknown DAG Node" editable={false}>
					<div class="bg-yellow-100 p-4 rounded">
						<p class="text-lg font-bold">Unknown DAG Node</p>
						<pre class="text-xs">{JSON.stringify(node, null, 2)}</pre>
						<pre class="text-xs">{JSON.stringify(node.container, null, 2)}</pre>
					</div>
				</Node>
			{/if}
		{/each}
	</Svelvet>
{/if}
