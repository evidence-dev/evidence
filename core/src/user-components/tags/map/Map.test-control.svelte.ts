let rows = $state<Array<Record<string, unknown>>>([]);

export const mapLayerCalls = {
	area: { add: 0, remove: 0 },
	point: { add: 0, remove: 0 },
	heatmap: { add: 0, remove: 0 }
};

export function getMapTestRows() {
	return rows;
}

export function setMapTestRows(nextRows: Array<Record<string, unknown>>) {
	rows = nextRows;
}

export function resetMapTestControl() {
	rows = [];
	for (const calls of Object.values(mapLayerCalls)) {
		calls.add = 0;
		calls.remove = 0;
	}
}
