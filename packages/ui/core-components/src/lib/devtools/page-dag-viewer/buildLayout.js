import {graphlib, layout} from '@dagrejs/dagre';

/**
 * @param {import("@evidence-dev/sdk/utils").DagNode[]} allNodes
 * @returns {dagre.graphlib.Graph}
 */
export const buildLayout = (allNodes) => {
	const dagreGraph = new graphlib.Graph();

	dagreGraph.setGraph({
		nodesep: 200,
		ranksep: 400,
		rankdir: 'TB',
		acyclicer: 'greedy',
		ranker: 'tight-tree',
		marginx: 50,
		marginy: 50
	});
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	allNodes.forEach((n) => {
		dagreGraph.setNode(n.mermaidId ?? 'default', { width: 300, height: 350 });
	});

	allNodes.forEach((n) => {
		n.children.forEach((child) => {
			dagreGraph.setEdge(n.mermaidId ?? 'default', child.mermaidId);
		});
	});
	dagreGraph.graph();
	layout(dagreGraph);

	return dagreGraph;
};
