// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import type * as maplibregl from 'maplibre-gl';
import { ClickHouseDialect } from '../../../../sql-dialect';
import type { AnyRowType } from '../../../interfaces/query-service';
import type { Connection } from '../../../../connection';
import { AreaLayerModel } from './AreaLayerModel.svelte';

class TestBounds {
	extend() {
		return this;
	}

	toArray() {
		return [
			[0, 0],
			[1, 1]
		];
	}
}

vi.mock('../map-gl', async () => {
	const actual = await vi.importActual<typeof import('../map-gl')>('../map-gl');
	return {
		...actual,
		loadMapGL: async () => ({ LngLatBounds: TestBounds })
	};
});

class TestMap {
	sources = new Map<string, maplibregl.SourceSpecification>();
	layers = new Map<string, maplibregl.LayerSpecification>();

	getSource(id: string) {
		return this.sources.get(id);
	}

	addSource(id: string, source: maplibregl.SourceSpecification) {
		this.sources.set(id, source);
	}

	removeSource(id: string) {
		this.sources.delete(id);
	}

	getLayer(id: string) {
		return this.layers.get(id);
	}

	addLayer(layer: maplibregl.LayerSpecification) {
		this.layers.set(layer.id, layer);
	}

	removeLayer(id: string) {
		this.layers.delete(id);
	}

	on() {}
	off() {}
	queryRenderedFeatures() {
		return [];
	}
	getCanvas() {
		return { style: { cursor: '' } };
	}
	setFeatureState() {}
}

const GEOJSON: GeoJSON.FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: { NAME: 'California' },
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 0]
					]
				]
			}
		},
		{
			type: 'Feature',
			properties: { NAME: 'New York' },
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[2, 2],
						[3, 2],
						[3, 3],
						[2, 2]
					]
				]
			}
		}
	]
};

async function settleQuery() {
	for (let index = 0; index < 10; index++) {
		await Promise.resolve();
		vi.runAllTimers();
		flushSync();
	}
}

describe('AreaLayerModel map source integration', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify(GEOJSON), { status: 200 }))
		);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('writes refreshed query values into GeoJSON and removes the rendered source', async () => {
		let rows = [
			{ state: 'California', sales: 10 },
			{ state: 'New York', sales: 20 }
		];
		const queryCalls = vi.fn();
		const connection: Connection = {
			id: 'default',
			type: 'managed',
			dialect: new ClickHouseDialect(),
			query: async <RowType extends AnyRowType>() => {
				queryCalls();
				return { rows: rows as unknown as RowType[], columns: [], error: null };
			}
		};
		let model!: AreaLayerModel;
		const cleanup = $effect.root(() => {
			model = new AreaLayerModel(
				() =>
					({
						data: 'map_data',
						area_id: 'state',
						value: 'sales',
						geojson_url: 'https://example.test/states.json',
						geojson_id: 'NAME',
						filters: [],
						tooltip: false,
						legend: true,
						value_fmt: 'num',
						show_unmatched: true
					}) as never,
				{
					connection,
					filterContexts: [],
					inlineQueries: undefined,
					projectSettings: undefined,
					defaultRefreshInterval: undefined
				}
			);
		});
		await settleQuery();
		expect(queryCalls).toHaveBeenCalledTimes(1);

		const map = new TestMap();
		await model.addToMap(map as never, ['#f7fbff', '#08306b'], 'light', 'labels');
		const initialSource = [...map.sources.values()][0] as maplibregl.GeoJSONSourceSpecification;
		const initialFeatures = (initialSource.data as GeoJSON.FeatureCollection).features;
		expect(
			initialFeatures.find((feature) => feature.properties?.NAME === 'New York')?.properties
		).toMatchObject({ __value: 20, __matched: true });

		rows = [
			{ state: 'California', sales: 10 },
			{ state: 'New York', sales: 99 }
		];
		model.query.refresh();
		await settleQuery();
		expect(queryCalls).toHaveBeenCalledTimes(2);
		model.removeFromMap(map as never);
		await model.addToMap(map as never, ['#f7fbff', '#08306b'], 'light', 'labels');

		const refreshedSource = [...map.sources.values()][0] as maplibregl.GeoJSONSourceSpecification;
		const refreshedFeatures = (refreshedSource.data as GeoJSON.FeatureCollection).features;
		expect(
			refreshedFeatures.find((feature) => feature.properties?.NAME === 'New York')?.properties
		).toMatchObject({ __value: 99, __matched: true });

		model.removeFromMap(map as never);
		expect(map.sources.size).toBe(0);
		expect(map.layers.size).toBe(0);
		cleanup();
	});
});
