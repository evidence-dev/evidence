// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { ClickHouseDialect } from '../../../sql-dialect';
import {
	getMapTestRows,
	mapLayerCalls,
	resetMapTestControl,
	setMapTestRows
} from './Map.test-control.svelte';
import MapTestHarness from './MapTestHarness.svelte';

vi.mock('./map.action', () => ({
	mapAction: (_node: HTMLElement, options: Record<string, (...args: unknown[]) => void>) => {
		const map = {
			getZoom: () => 3,
			on: () => undefined,
			getLayer: () => undefined,
			setCenter: () => undefined,
			setZoom: () => undefined,
			fitBounds: () => undefined
		};
		options.onCreate?.(map);
		options.onReady?.();
		return { destroy: () => options.onDestroy?.() };
	}
}));

vi.mock('./area_layer/AreaLayerModel.svelte', async () => {
	const control = await import('./Map.test-control.svelte');
	return {
		AreaLayerModel: class {
			layerId = 'test-area-layer';
			definitionIndex: number;
			query = { error: null };

			constructor(
				_props: unknown,
				_options: unknown,
				_getPointLayerIds: unknown,
				definitionIndex = 0
			) {
				this.definitionIndex = definitionIndex;
			}

			get loading() {
				return false;
			}

			get data() {
				return control.getMapTestRows();
			}

			removeFromMap() {
				control.mapLayerCalls.area.remove++;
			}

			async addToMap() {
				control.mapLayerCalls.area.add++;
			}

			getCachedBounds() {
				return null;
			}
		}
	};
});

vi.mock('./point_layer/PointLayerModel.svelte', async () => {
	const control = await import('./Map.test-control.svelte');
	return {
		PointLayerModel: class {
			layerId = 'test-point-layer';
			definitionIndex: number;
			query = { error: null };
			clusteringEnabled = false;

			constructor(_props: unknown, _options: unknown, definitionIndex = 0) {
				this.definitionIndex = definitionIndex;
			}

			get loading() {
				return false;
			}

			get data() {
				return control.getMapTestRows();
			}

			removeFromMap() {
				control.mapLayerCalls.point.remove++;
			}

			async addToMap() {
				control.mapLayerCalls.point.add++;
			}

			getCachedBounds() {
				return null;
			}
		}
	};
});

vi.mock('./heatmap_layer/HeatmapLayerModel.svelte', async () => {
	const control = await import('./Map.test-control.svelte');
	return {
		HeatmapLayerModel: class {
			layerId = 'test-heatmap-layer';
			definitionIndex: number;
			query = { error: null };

			constructor(_props: unknown, _options: unknown, definitionIndex = 0) {
				this.definitionIndex = definitionIndex;
			}

			get loading() {
				return false;
			}

			get data() {
				return control.getMapTestRows();
			}

			removeFromMap() {
				control.mapLayerCalls.heatmap.remove++;
			}

			async addToMap() {
				control.mapLayerCalls.heatmap.add++;
			}

			getCachedBounds() {
				return null;
			}
		}
	};
});

async function settle() {
	await tick();
	flushSync();
	await tick();
}

describe('Map layer data updates', () => {
	beforeEach(resetMapTestControl);

	it('replaces changed layer data and removes the layer for an empty result', async () => {
		setMapTestRows([
			{ area_id: 'CA', value: 10 },
			{ area_id: 'NY', value: 20 }
		]);
		const target = document.createElement('div');
		const mounted = mount(MapTestHarness, {
			target,
			props: {
				queryService: {
					workspaceId: 'workspace',
					connectionType: 'managed',
					dialect: new ClickHouseDialect(),
					query: async () => ({ rows: [], columns: [], error: null })
				}
			}
		});
		await settle();
		expect(mapLayerCalls).toEqual({
			area: { add: 1, remove: 0 },
			point: { add: 1, remove: 0 },
			heatmap: { add: 1, remove: 0 }
		});

		setMapTestRows([
			{ area_id: 'CA', value: 10 },
			{ area_id: 'NY', value: 99 }
		]);
		await settle();
		expect(mapLayerCalls).toEqual({
			area: { add: 2, remove: 1 },
			point: { add: 2, remove: 1 },
			heatmap: { add: 2, remove: 1 }
		});

		setMapTestRows([]);
		await settle();
		expect(mapLayerCalls).toEqual({
			area: { add: 2, remove: 2 },
			point: { add: 2, remove: 2 },
			heatmap: { add: 2, remove: 2 }
		});
		expect(getMapTestRows()).toEqual([]);

		unmount(mounted);
	});
});
