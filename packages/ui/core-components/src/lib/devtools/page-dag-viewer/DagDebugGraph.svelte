<script>
	import { Background, Controls, Svelvet } from 'svelvet';
	import QueryNode from './QueryNode.svelte';
	import InputNode from './InputNode.svelte';
	import { buildLayout } from './buildLayout.js';
	import { Query } from '@evidence-dev/sdk/usql';
	import { DagNode, Input } from '@evidence-dev/sdk/utils';

	import { setContext } from 'svelte';
	import { readonly, writable } from 'svelte/store';

	/** @type {import("@evidence-dev/sdk/utils").WithDag[]} */
	export let rootNodes = [];

	const reduceNodes = (nodes) => {
		return nodes.reduce((a, v) => {
			/** @param {import("@evidence-dev/sdk/utils").DagNode} n*/
			const recursive = (n) => {
				if (!DagNode.isDagNode(n)) return;
				n.children.forEach((child) => recursive(child));
				a.add(n);
			};
			recursive(v.__dag);
			if (DagNode.isDagNode(v.__dag)) {
				a.add(v.__dag);
			}

			return a;
		}, new Set());
	};
	let allNodes = [...reduceNodes(rootNodes)];
	$: allNodes = [...reduceNodes(rootNodes)];

	$: console.log({ allNodes });

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
	<Svelvet editable={false} height={1080} fitView endStyles={['arrow', null]} controls={false}>
		<Background gridWidth={40} dotSize={3} slot="background" />
		<Controls slot="controls">
			<!-- Contains display information -->
			<div class="font-sans">
				Selected Epoch: {$selectedEpoch?.description ?? 'None'}
			</div>
		</Controls>
		{#each allNodes as node}
			{#if Query.isQuery(node.container)}
				<QueryNode query={node.container} />
			{:else if Input.isInput(node.container)}
				<InputNode input={node.container} />
			{/if}
		{/each}
	</Svelvet>
{/if}
