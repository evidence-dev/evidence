import type { HeatmapLayerProps } from './HeatmapLayer.svelte';
import type * as maplibregl from 'maplibre-gl';
import { loadMapGL, getLabelInsertionId, MAP_POINT_ROW_LIMIT } from '../map-gl';
import { Query } from '../../../../Query.svelte';
import { processColumnExpression } from '../../../common/sql-expression-utils';
import { extractSQLProps } from '../../../common/sql-options';
import { logger } from '../../../../shims/logger';
import type { SqlDialect } from '../../../../sql-dialect';
import { resolveDeprecatedAttribute } from '../../../common/resolve-deprecated-attribute';

type Expression = maplibregl.ExpressionSpecification;

type FeatureProperties = {
	__id: number;
	__lat: number;
	__lng: number;
	__weight?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export class HeatmapLayerModel {
	private propsGetter: () => HeatmapLayerProps;
	public layerId: string;
	private sourceId: string;
	query: Query;
	// Definition order index for consistent layer ordering regardless of load timing
	public definitionIndex: number;

	private dialect: SqlDialect;

	constructor(
		propsGetter: () => HeatmapLayerProps,
		options: ConstructorParameters<typeof Query>[1],
		definitionIndex: number = 0
	) {
		this.propsGetter = propsGetter;
		this.layerId = `heatmap-layer-${Math.random().toString(36).substr(2, 9)}`;
		this.sourceId = `heatmap-source-${Math.random().toString(36).substr(2, 9)}`;
		this.definitionIndex = definitionIndex;
		this.dialect = options.queryService.dialect;
		// Same map carve-out as point_layer: honor explicit limits up to the map cap.
		this.query = new Query(() => this.queryConfig, options, {
			maxUserLimit: MAP_POINT_ROW_LIMIT
		});
	}

	get props(): HeatmapLayerProps {
		return this.propsGetter();
	}

	private get queryConfig() {
		const props = this.props;
		const { where, having, limit, order, qualify } = extractSQLProps(props);

		const columns = [
			processColumnExpression({ value: props.lat }, this.dialect),
			processColumnExpression({ value: props.lng }, this.dialect)
		];

		if (props.weight) {
			const weightProcessed = processColumnExpression({ value: props.weight }, this.dialect);
			columns.push(weightProcessed);
		}

		return {
			tableExpressionName: props.data,
			columns,
			filterIds: props.filters ?? [],
			where,
			having,
			qualify,
			order,
			// Clamp to the map cap (see point_layer) so an over-large limit is
			// honored at the ceiling instead of falling back to 2k sampling.
			limit: limit !== undefined ? Math.min(limit, MAP_POINT_ROW_LIMIT) : limit,
			date_range: props.date_range,
			fillProps: {
				useFill: false,
				series: '',
				xColumn: ''
			}
		};
	}

	get data() {
		return this.query.result?.rows ?? [];
	}

	get loading() {
		return this.query.loading;
	}

	private cachedBounds: maplibregl.LngLatBounds | null = null;

	// Reactive state for legend display
	colorScale = $state<string[] | null>(null);
	isAddedToMap = $state(false);

	getCachedBounds(): maplibregl.LngLatBounds | null {
		return this.cachedBounds;
	}

	// Default heatmap color ramp (blue → red density gradient)
	// This creates a cool-to-hot gradient that looks good for density visualization
	private static readonly DEFAULT_HEATMAP_COLORS = [
		'rgba(33,102,172,0)', // transparent blue at density 0
		'rgb(103,169,207)', // light blue
		'rgb(209,229,240)', // very light blue/white
		'rgb(253,219,199)', // peach
		'rgb(239,138,98)', // orange
		'rgb(178,24,43)' // red
	];

	async addToMap(
		map: maplibregl.Map,
		_defaultColorScale: string[],
		_theme: 'light' | 'dark',
		beforeId?: string
	): Promise<void> {
		const props = this.props;
		const data = this.data;

		// Get processed column aliases
		const latProcessed = processColumnExpression({ value: props.lat }, this.dialect);
		const lngProcessed = processColumnExpression({ value: props.lng }, this.dialect);
		const latColumn = latProcessed.alias;
		const lngColumn = lngProcessed.alias;

		let weightColumn: string | null = null;

		if (props.weight) {
			const weightProcessed = processColumnExpression({ value: props.weight }, this.dialect);
			weightColumn = weightProcessed.alias;
			logger.debug({ weight: props.weight, weightColumn }, '[HeatmapLayer] Weight column');
		}

		// Collect weight values for scaling
		const weightValues: number[] = [];
		data.forEach((row) => {
			if (weightColumn) {
				const val = Number(row[weightColumn]);
				if (!isNaN(val) && isFinite(val)) weightValues.push(val);
			}
		});

		const minWeight = weightValues.length > 0 ? Math.min(...weightValues) : 0;
		const maxWeight = weightValues.length > 0 ? Math.max(...weightValues) : 1;

		// Convert data to GeoJSON
		const features = data
			.map((row, idx): GeoJSON.Feature<GeoJSON.Point, FeatureProperties> | null => {
				const lat = Number(row[latColumn]);
				const lng = Number(row[lngColumn]);

				// Skip invalid coordinates
				if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
					return null;
				}

				const properties: FeatureProperties = {
					__id: idx,
					__lat: lat,
					__lng: lng
				};

				// Pre-compute normalized weight (0-1 range)
				if (weightColumn) {
					const weightVal = Number(row[weightColumn]) || 0;
					// Normalize to 0-1 range
					if (maxWeight > minWeight) {
						properties.__weight = (weightVal - minWeight) / (maxWeight - minWeight);
					} else {
						properties.__weight = 1;
					}
				}

				return {
					id: idx,
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [lng, lat] as [number, number]
					},
					properties
				};
			})
			.filter((f): f is GeoJSON.Feature<GeoJSON.Point, FeatureProperties> => f !== null);

		const geojson: GeoJSON.FeatureCollection = {
			type: 'FeatureCollection',
			features
		};

		logger.debug(
			{
				featureCount: features.length,
				sampleFeature: features[0]?.properties,
				weightColumn,
				minWeight,
				maxWeight
			},
			'[HeatmapLayer] GeoJSON created'
		);

		// Calculate bounds from points
		if (features.length > 0) {
			const gl = await loadMapGL();
			const bounds = new gl.LngLatBounds();
			features.forEach((feature) => {
				if (feature.geometry.type === 'Point') {
					bounds.extend(feature.geometry.coordinates as [number, number]);
				}
			});
			this.cachedBounds = bounds;
			logger.debug({ bounds: bounds.toArray() }, '[HeatmapLayer] Calculated bounds');
		}

		// Build heatmap color expression. `color_palette` is the deprecated
		// alias for `color_scale`; resolver dev-warns when the old name is used.
		const colorScale =
			resolveDeprecatedAttribute({
				preferred: props.color_scale,
				deprecated: props.color_palette,
				preferredName: 'color_scale',
				deprecatedName: 'color_palette',
				componentName: 'heatmap_layer'
			}) ?? HeatmapLayerModel.DEFAULT_HEATMAP_COLORS;
		const heatmapColorExpression = this.buildHeatmapColorExpression(colorScale);

		// Store color scale for potential legend display
		this.colorScale = colorScale;

		// Build weight expression
		let weightExpression: Expression | number;
		if (weightColumn) {
			// Use pre-computed normalized weight
			weightExpression = ['coalesce', ['get', '__weight'], 1];
		} else {
			weightExpression = 1;
		}

		// Get config values
		const radius = props.radius ?? 30;
		const intensity = props.intensity ?? 1;
		const opacity = props.opacity ?? 0.8;

		// Add source or update it if it exists
		const existingSource = map.getSource(this.sourceId);
		if (!existingSource) {
			map.addSource(this.sourceId, {
				type: 'geojson',
				data: geojson
			});
		} else {
			// Update existing source
			(existingSource as maplibregl.GeoJSONSource).setData(geojson);
		}

		const insertBeforeId = beforeId ?? getLabelInsertionId(map);

		// Build the layer config
		// Standard heatmap pattern: radius and intensity increase with zoom
		const layerConfig: maplibregl.LayerSpecification = {
			id: this.layerId,
			type: 'heatmap',
			source: this.sourceId,
			paint: {
				// Weight of each point
				'heatmap-weight': weightExpression,
				// Intensity increases with zoom (default 1, scaled by user's intensity)
				'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, intensity, 9, intensity * 3],
				// Color ramp for heatmap
				'heatmap-color': heatmapColorExpression,
				// Radius increases with zoom (default 30, constant)
				// We scale from small at world view to user's radius at mid-zoom
				'heatmap-radius': [
					'interpolate',
					['linear'],
					['zoom'],
					0,
					2, // Small at world view
					9,
					radius // User's configured radius at regional zoom
				],
				// Opacity
				'heatmap-opacity': opacity
			}
		};

		// Apply zoom thresholds if provided
		if (props.zoom_threshold) {
			layerConfig.minzoom = props.zoom_threshold[0];
			layerConfig.maxzoom = props.zoom_threshold[1];
		}

		// Only add if not already present
		if (!map.getLayer(this.layerId)) {
			map.addLayer(layerConfig, insertBeforeId);
			logger.debug(
				{ layerId: this.layerId, insertBeforeId },
				'[HeatmapLayer] Heatmap layer added to map'
			);
		} else {
			// Update existing heatmap layer properties
			map.setPaintProperty(this.layerId, 'heatmap-weight', weightExpression);
			map.setPaintProperty(this.layerId, 'heatmap-color', heatmapColorExpression);
			map.setPaintProperty(this.layerId, 'heatmap-radius', [
				'interpolate',
				['linear'],
				['zoom'],
				0,
				2,
				9,
				radius
			]);
			map.setPaintProperty(this.layerId, 'heatmap-intensity', [
				'interpolate',
				['linear'],
				['zoom'],
				0,
				intensity,
				9,
				intensity * 3
			]);
			map.setPaintProperty(this.layerId, 'heatmap-opacity', opacity);
			logger.debug({ layerId: this.layerId }, '[HeatmapLayer] Heatmap layer updated');
		}

		// Mark as added for legend visibility
		this.isAddedToMap = true;
	}

	/**
	 * Build the heatmap-color expression from a color palette.
	 * Colors are distributed evenly across the 0-1 density range.
	 */
	private buildHeatmapColorExpression(colorPalette: string[]): Expression {
		// We need at least 2 colors for a gradient
		const colors = colorPalette.length >= 2 ? colorPalette : ['#ffffb2', '#fd8d3c', '#bd0026'];

		const expression: Expression = ['interpolate', ['linear'], ['heatmap-density']];

		// Distribute colors evenly across 0 to 1 range
		// For default colors, this gives: 0, 0.2, 0.4, 0.6, 0.8, 1.0
		const steps = colors.length;
		colors.forEach((color, index) => {
			const position = index / (steps - 1);
			expression.push(position, color);
		});

		return expression;
	}

	removeFromMap(map: maplibregl.Map): void {
		// Remove layer
		if (map.getLayer(this.layerId)) {
			map.removeLayer(this.layerId);
		}
		if (map.getSource(this.sourceId)) {
			map.removeSource(this.sourceId);
		}

		// Reset reactive state
		this.isAddedToMap = false;
		this.colorScale = null;
	}
}
