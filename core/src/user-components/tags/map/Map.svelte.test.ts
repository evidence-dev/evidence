// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { ClickHouseDialect } from '../../../sql-dialect';
import {
	getMapTestRows,
	mapLayerCalls,
	resetMapTestControl,
	setMapTestPropOverrides,
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
				private propsGetter: () => object,
				_options: unknown,
				_getPointLayerIds: unknown,
				definitionIndex = 0
			) {
				this.definitionIndex = definitionIndex;
			}

			get props() {
				return this.propsGetter();
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

			constructor(
				private propsGetter: () => object,
				_options: unknown,
				definitionIndex = 0
			) {
				this.definitionIndex = definitionIndex;
			}

			get props() {
				return this.propsGetter();
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

			constructor(
				private propsGetter: () => object,
				_options: unknown,
				definitionIndex = 0
			) {
				this.definitionIndex = definitionIndex;
			}

			get props() {
				return this.propsGetter();
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

let mounted: ReturnType<typeof mount> | undefined;

async function mountMap() {
	mounted = mount(MapTestHarness, {
		target: document.createElement('div'),
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
}

describe('Map layer data updates', () => {
	beforeEach(resetMapTestControl);
	afterEach(() => {
		if (mounted) unmount(mounted);
		mounted = undefined;
	});

	it('replaces changed layer data and removes the layer for an empty result', async () => {
		setMapTestRows([
			{ area_id: 'CA', value: 10 },
			{ area_id: 'NY', value: 20 }
		]);
		await mountMap();
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
	});

	it('redraws a layer when a styling prop changes without new data', async () => {
		setMapTestRows([{ area_id: 'CA', value: 10, lat: 1, lng: 2 }]);
		await mountMap();

		setMapTestPropOverrides({ color: '#ff0000' });
		await settle();
		expect(mapLayerCalls).toEqual({
			area: { add: 1, remove: 0 },
			point: { add: 2, remove: 1 },
			heatmap: { add: 1, remove: 0 }
		});

		setMapTestPropOverrides({ color: '#ff0000', color_palette: ['#fee5d9', '#a50f15'] });
		await settle();
		expect(mapLayerCalls).toEqual({
			area: { add: 2, remove: 1 },
			point: { add: 3, remove: 2 },
			heatmap: { add: 2, remove: 1 }
		});
	});

	it('leaves query props to the data refresh instead of redrawing on the prop alone', async () => {
		setMapTestRows([{ area_id: 'CA', value: 10, lat: 1, lng: 2 }]);
		await mountMap();

		setMapTestPropOverrides({ lat: 'latitude', area_id: 'state', where: 'value > 1' });
		await settle();
		expect(mapLayerCalls).toEqual({
			area: { add: 1, remove: 0 },
			point: { add: 1, remove: 0 },
			heatmap: { add: 1, remove: 0 }
		});
	});

	it('redraws a point layer when clustering is toggled', async () => {
		setMapTestRows([{ lat: 1, lng: 2 }]);
		await mountMap();

		setMapTestPropOverrides({ cluster: true });
		await settle();
		expect(mapLayerCalls.point).toEqual({ add: 2, remove: 1 });
	});
});
