import dagre from '@dagrejs/dagre';

/**
 * @param {import("@evidence-dev/sdk/utils").DagNode[]} allNodes
 * @returns {dagre.graphlib.Graph}
 */
export const buildLayout = (allNodes) => {
	const dagreGraph = new dagre.graphlib.Graph();

	dagreGraph.setGraph({
		nodesep: 200,
		ranksep: 200,
		rankdir: 'TB',
		acyclicer: 'greedy',
		ranker: 'tight-tree',
		marginx: 50,
		marginy: 50
	});
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	allNodes.forEach((n) => {
		dagreGraph.setNode(n.mermaidId ?? 'default', { width: 200, height: 100 });
	});

	allNodes.forEach((n) => {
		n.children.forEach((child) => {
			dagreGraph.setEdge(n.mermaidId ?? 'default', child.mermaidId);
		});
	});
	dagreGraph.graph();
	dagre.layout(dagreGraph);

	return dagreGraph;
};
