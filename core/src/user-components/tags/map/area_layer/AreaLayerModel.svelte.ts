import type { AreaLayerProps } from './AreaLayer.svelte';
import type * as maplibregl from 'maplibre-gl';
import { loadMapGL, getLabelInsertionId } from '../map-gl';
import chroma from 'chroma-js';
import { Query } from '../../../../Query.svelte';
import { processColumnExpression } from '../../../common/sql-expression-utils';
import { extractSQLProps } from '../../../common/sql-options';
import type { SqlDialect } from '../../../../sql-dialect';
import { logger } from '../../../../shims/logger';
import { GEOGRAPHIES, type GeographyName } from './geographies';
import { createColorScale, getColorForValue } from '../../../common/color-scale-utils';
import { resolveDeprecatedAttribute } from '../../../common/resolve-deprecated-attribute';
import {
	createMapTooltip,
	buildTooltipHTML,
	formatFieldLabel,
	type TooltipField
} from '../tooltip-utils';
import { enrichFeaturesWithStateInfo, STATE_NAME_TO_ABBREV } from './state-fips';

export class AreaLayerModel {
	private propsGetter: () => AreaLayerProps;
	public layerId: string;
	private sourceId: string;
	query: Query;
	private popup: maplibregl.Popup | null = null;
	private mouseMoveHandler: ((e: maplibregl.MapLayerMouseEvent) => void) | null = null;
	private mouseLeaveHandler: (() => void) | null = null;
	private hoveredFeatureId: string | number | undefined = undefined;
	private getPointLayerIds: () => string[] = () => [];
	// Definition order index for consistent layer ordering regardless of load timing
	public definitionIndex: number;

	private dialect: SqlDialect;

	constructor(
		propsGetter: () => AreaLayerProps,
		options: ConstructorParameters<typeof Query>[1],
		getPointLayerIds?: () => string[],
		definitionIndex: number = 0
	) {
		this.propsGetter = propsGetter;
		// Generate unique IDs for this layer
		this.layerId = `area-layer-${Math.random().toString(36).substr(2, 9)}`;
		this.sourceId = `area-source-${Math.random().toString(36).substr(2, 9)}`;
		this.definitionIndex = definitionIndex;
		this.dialect = options.queryService.dialect;

		// Store getPointLayerIds function for tooltip priority
		if (getPointLayerIds) {
			this.getPointLayerIds = getPointLayerIds;
		}

		// Create query for this layer
		this.query = new Query(() => this.queryConfig, options);
	}

	get props(): AreaLayerProps {
		return this.propsGetter();
	}

	private get queryConfig() {
		const props = this.props;
		const { where, having, limit, order, qualify } = extractSQLProps(props);

		const areaIdProcessed = processColumnExpression({ value: props.area_id }, this.dialect);
		const valueProcessed = processColumnExpression({ value: props.value }, this.dialect);

		const columns = [areaIdProcessed, valueProcessed];

		if (props.tooltip_fields) {
			for (const field of props.tooltip_fields) {
				const fieldProcessed = processColumnExpression({ value: field }, this.dialect);
				columns.push(fieldProcessed);
			}
		}

		return {
			tableExpressionName: props.data,
			columns,
			filterIds: props.filters ?? [],
			where,
			having,
			qualify,
			order,
			limit,
			date_range: props.date_range
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
	valueColumn = $state<string>('value');
	isAddedToMap = $state(false);
	// Domain bounds for legend rendering — reflect any min/max overrides.
	minValue = $state<number | null>(null);
	maxValue = $state<number | null>(null);
	midpoint = $state<number | null>(null);
	colorDomain = $state<number[] | null>(null);

	getCachedBounds(): maplibregl.LngLatBounds | null {
		return this.cachedBounds;
	}

	async addToMap(
		map: maplibregl.Map,
		defaultColorScale: string[],
		theme: 'light' | 'dark',
		beforeId?: string
	): Promise<void> {
		const props = this.props;
		const data = this.data;

		// Get processed column aliases
		const areaIdProcessed = processColumnExpression({ value: props.area_id }, this.dialect);
		const valueProcessed = processColumnExpression({ value: props.value }, this.dialect);
		const areaIdColumn = areaIdProcessed.alias;
		const valueColumn = valueProcessed.alias;

		// Determine GeoJSON URL and ID configuration
		let geojsonUrl: string;
		let geojsonIdConfig: string | string[]; // string = single property, array = composite

		if (props.geography) {
			// Use preset geography with match_by
			const geography = GEOGRAPHIES[props.geography as GeographyName];
			geojsonUrl = geography.url;

			// match_by is required for preset geographies
			if (!props.match_by) {
				throw new Error('match_by is required when using geography');
			}

			if (props.geography === 'us_states') {
				if (props.match_by === 'name') {
					geojsonIdConfig = 'NAME';
				} else if (props.match_by === 'abbr') {
					geojsonIdConfig = 'STATE_ABBREV'; // computed at runtime
				} else if (props.match_by === 'fips') {
					geojsonIdConfig = 'STATE';
				} else {
					throw new Error(`Invalid match_by "${props.match_by}" for us_states`);
				}
			} else if (props.geography === 'us_counties') {
				if (props.match_by === 'state-county') {
					geojsonIdConfig = ['STATE_NAME', 'NAME']; // e.g., "Texas-Dallas"
				} else if (props.match_by === 'fips') {
					geojsonIdConfig = ['STATE', 'COUNTY']; // e.g., "48113"
				} else {
					throw new Error(
						`Invalid match_by "${props.match_by}" for us_counties. Use "state-county" or "fips".`
					);
				}
			} else {
				throw new Error(`Unknown geography: ${props.geography}`);
			}
		} else {
			// Use custom GeoJSON with geojson_id
			if (!props.geojson_url) {
				throw new Error('Either geography OR geojson_url must be provided');
			}
			if (!props.geojson_id) {
				throw new Error('geojson_id is required when using geojson_url');
			}
			geojsonUrl = props.geojson_url;
			geojsonIdConfig = props.geojson_id; // can be string or array
		}

		// Check if we're using state-county matching (need to support abbreviations)
		const isStateCountyMatch =
			props.geography === 'us_counties' && props.match_by === 'state-county';
		const isCountyFipsMatch = props.geography === 'us_counties' && props.match_by === 'fips';

		// Helper to get all possible feature IDs (for flexible matching)
		// Returns array of possible keys to check against user data
		const getFeatureIds = (properties: Record<string, unknown> | null): string[] => {
			if (!properties) return [];

			if (Array.isArray(geojsonIdConfig)) {
				// Composite key
				const primaryKey = geojsonIdConfig.map((prop) => String(properties[prop] ?? '')).join('-');

				// For state-county, also generate abbreviation variant
				if (isStateCountyMatch && properties.STATE_NAME && properties.NAME) {
					const stateName = String(properties.STATE_NAME);
					const countyName = String(properties.NAME);
					const stateAbbrev = STATE_NAME_TO_ABBREV[stateName] ?? stateName;

					return [
						`${stateName}-${countyName}`.toLowerCase(), // "texas-dallas"
						`${stateAbbrev}-${countyName}`.toLowerCase() // "tx-dallas"
					];
				}

				// County fips only: accept the documented undashed form ("48113" alongside "48-113").
				// Not for custom composites, where concatenation could collide ("north"+"A2" vs "northA"+"2")
				if (isCountyFipsMatch) {
					const concatenated = geojsonIdConfig
						.map((prop) => String(properties[prop] ?? ''))
						.join('');
					return [primaryKey.toLowerCase(), concatenated.toLowerCase()];
				}

				return [primaryKey.toLowerCase()];
			}

			// Single property
			return [String(properties[geojsonIdConfig] ?? '').toLowerCase()];
		};

		// Fetch the GeoJSON
		const response = await fetch(geojsonUrl);
		const geojson = (await response.json()) as GeoJSON.FeatureCollection;

		// Enrich features with computed state name/abbreviation from FIPS codes
		// This allows users to use STATE_NAME or STATE_ABBREV in composite IDs
		enrichFeaturesWithStateInfo(geojson.features);

		// Create a map of area_id -> value from query data (case-insensitive)
		const dataMap = new Map<string, number>();
		data.forEach((row) => {
			const areaId = String(row[areaIdColumn]).toLowerCase(); // Case-insensitive
			const value = Number(row[valueColumn]) || 0;
			dataMap.set(areaId, value);
		});

		logger.debug({ dataMap: Object.fromEntries(dataMap) }, '[AreaLayer] Data map');
		logger.debug({ data, areaIdColumn, valueColumn }, '[AreaLayer] Query data and columns');

		// Create color scale using shared utility. `color_palette` is the
		// deprecated alias for `color_scale`; resolver prefers the new name and
		// dev-warns when the old one is used.
		const colorScale = resolveDeprecatedAttribute({
			preferred: props.color_scale,
			deprecated: props.color_palette,
			preferredName: 'color_scale',
			deprecatedName: 'color_palette',
			componentName: 'area_layer'
		});
		const values = Array.from(dataMap.values());
		const colorScaleResult = createColorScale(values, {
			colorPalette: colorScale,
			defaultColorScale,
			context: 'AreaLayer',
			min: props.min,
			max: props.max,
			midpoint: props.midpoint
		});

		if (!colorScaleResult) {
			logger.error('[AreaLayer] Failed to create color scale');
			return;
		}

		// Store for legend
		this.colorScale = colorScaleResult.colorPalette;
		this.valueColumn = valueColumn;
		this.minValue = colorScaleResult.minValue;
		this.maxValue = colorScaleResult.maxValue;
		this.midpoint = colorScaleResult.midpoint;
		this.colorDomain = colorScaleResult.domain;

		// Add value data to GeoJSON features
		let matchedCount = 0;
		const unmatchedColor = theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
		const unmatchedBorderColor = theme === 'dark' ? '#4a4a4a' : '#c0c0c0';

		// Helper to find matching value from any of the possible keys
		const findMatchingValue = (
			properties: Record<string, unknown> | null
		): { value: number; matchedKey: string } | null => {
			const possibleKeys = getFeatureIds(properties);
			for (const key of possibleKeys) {
				if (dataMap.has(key)) {
					return { value: dataMap.get(key)!, matchedKey: key };
				}
			}
			return null;
		};

		// Filter features if show_unmatched is false
		const show_unmatched = props.show_unmatched ?? true;
		const featuresToRender = show_unmatched
			? geojson.features
			: geojson.features.filter((f) => {
					return findMatchingValue(f.properties as Record<string, unknown>) !== null;
				});

		featuresToRender.forEach((feature) => {
			const match = findMatchingValue(feature.properties as Record<string, unknown>);
			const value = match?.value;
			const geoId =
				match?.matchedKey ?? getFeatureIds(feature.properties as Record<string, unknown>)[0] ?? '';

			if (value !== undefined) {
				matchedCount++;
				const fillColor = getColorForValue(value, colorScaleResult);
				// Create border color by darkening the fill color
				const borderColor = chroma(fillColor).darken(1).hex();

				feature.properties = {
					...feature.properties,
					__geoId: geoId, // Store matched key for feature state
					__value: value,
					__color: fillColor,
					__borderColor: borderColor,
					__matched: true
				};
				// Add custom tooltip fields from the matching data row
				if (props.tooltip_fields) {
					// geoId is the lowercased match key — compare case-insensitively like the value lookup
					const dataRow = data.find((row) => String(row[areaIdColumn]).toLowerCase() === geoId);
					if (dataRow) {
						for (const field of props.tooltip_fields) {
							const fieldColumn = processColumnExpression({ value: field }, this.dialect).alias;
							if (dataRow[fieldColumn] !== undefined) {
								feature.properties[fieldColumn] = dataRow[fieldColumn];
							}
						}
					}
				}
			} else {
				// Set a subtle color for unmatched features
				feature.properties = {
					...feature.properties,
					__geoId: geoId, // Store computed ID for feature state
					__value: null,
					__color: unmatchedColor,
					__borderColor: unmatchedBorderColor,
					__matched: false
				};
			}
		});

		// Update geojson to only include features we want to render
		geojson.features = featuresToRender;

		logger.debug(
			{ matchedCount, totalFeatures: geojson.features.length },
			'[AreaLayer] Matched features'
		);
		const sampleFeature = geojson.features.find((f) => f.properties?.__value !== null)?.properties;
		if (sampleFeature) {
			logger.debug({ sampleFeature }, '[AreaLayer] Sample matched feature');
		}

		// Calculate bounds from matched features only
		const matchedFeatures = geojson.features.filter((f) => f.properties?.__matched === true);
		if (matchedFeatures.length > 0) {
			const bounds = new (await loadMapGL()).LngLatBounds();
			matchedFeatures.forEach((feature) => {
				if (feature.geometry.type === 'Polygon') {
					feature.geometry.coordinates[0].forEach((coord) => {
						bounds.extend(coord as [number, number]);
					});
				} else if (feature.geometry.type === 'MultiPolygon') {
					feature.geometry.coordinates.forEach((polygon) => {
						polygon[0].forEach((coord) => {
							bounds.extend(coord as [number, number]);
						});
					});
				}
			});
			this.cachedBounds = bounds;
			logger.debug({ bounds: bounds.toArray() }, '[AreaLayer] Calculated bounds');
		}

		// Add source with promoteId for feature-state (only if not already added)
		if (!map.getSource(this.sourceId)) {
			map.addSource(this.sourceId, {
				type: 'geojson',
				data: geojson,
				promoteId: '__geoId' // Use computed ID (single or composite) for hover state
			});
		}

		// Add fill layer with zoom thresholds
		const layerConfig: maplibregl.LayerSpecification = {
			id: this.layerId,
			type: 'fill',
			source: this.sourceId,
			paint: {
				'fill-color': ['coalesce', ['get', '__color'], '#cccccc'],
				'fill-opacity': 0.7
			}
		};

		// Apply zoom thresholds if provided
		if (props.zoom_threshold) {
			layerConfig.minzoom = props.zoom_threshold[0];
			layerConfig.maxzoom = props.zoom_threshold[1];
		}

		const insertBeforeId = beforeId ?? getLabelInsertionId(map);

		// Only add if not already present
		if (!map.getLayer(this.layerId)) {
			map.addLayer(layerConfig, insertBeforeId);
		}

		// Add border layer with conditional styling and hover state
		const borderLayerConfig: maplibregl.LayerSpecification = {
			id: `${this.layerId}-border`,
			type: 'line',
			source: this.sourceId,
			paint: {
				'line-color': [
					'case',
					['boolean', ['feature-state', 'hover'], false],
					// Hover state colors - use border color but brighter
					theme === 'dark' ? '#ffffff' : '#000000',
					// Default: use calculated border color (darkened version of fill)
					['coalesce', ['get', '__borderColor'], unmatchedBorderColor]
				],
				'line-opacity': [
					'case',
					['boolean', ['feature-state', 'hover'], false],
					0.8, // Higher opacity on hover
					['case', ['get', '__matched'], 0.6, 0.1]
				],
				'line-width': [
					'case',
					['boolean', ['feature-state', 'hover'], false],
					1.5, // Thicker on hover
					1
				]
			}
		};

		// Apply same zoom thresholds to border
		if (props.zoom_threshold) {
			borderLayerConfig.minzoom = props.zoom_threshold[0];
			borderLayerConfig.maxzoom = props.zoom_threshold[1];
		}

		// Only add if not already present (also insert at same position as fill layer)
		if (!map.getLayer(`${this.layerId}-border`)) {
			map.addLayer(borderLayerConfig, insertBeforeId);
		}

		// Add tooltips if enabled
		if (props.tooltip !== false) {
			this.addTooltips(map, valueColumn, geojsonIdConfig);
		}

		// Mark as added for legend visibility
		this.isAddedToMap = true;
	}

	private async addTooltips(
		map: maplibregl.Map,
		valueColumn: string,
		geojsonIdConfig: string | string[]
	): Promise<void> {
		const props = this.props;

		// Determine which GeoJSON property to use for display name:
		// 1. If name_property is explicitly set, use it
		// 2. If geojson_id is a simple string (custom GeoJSON), use that
		// 3. Otherwise default to 'NAME' (preset geographies)
		let nameProperty: string;
		if (props.name_property) {
			nameProperty = props.name_property;
		} else if (typeof geojsonIdConfig === 'string') {
			// Custom GeoJSON with simple key - use that as display name
			nameProperty = geojsonIdConfig;
		} else {
			// Composite key (preset geography) - use NAME
			nameProperty = 'NAME';
		}

		// Create a popup instance with echarts-like styling
		this.popup = await createMapTooltip();

		// Show popup and hover effect (only for matched areas)
		this.mouseMoveHandler = (e: maplibregl.MapLayerMouseEvent) => {
			if (!e.features?.[0]) return;

			const feature = e.features[0];
			const properties = feature.properties;
			if (!properties) return;

			// Check if there are point layer features at this location (they take priority)
			const pointLayerIds = this.getPointLayerIds();
			if (pointLayerIds.length > 0) {
				const pointFeatures = map.queryRenderedFeatures(e.point, {
					layers: pointLayerIds
				});
				if (pointFeatures.length > 0) {
					// Point layer has priority, don't show area tooltip
					this.popup?.remove();
					map.getCanvas().style.cursor = '';
					return;
				}
			}

			// Only apply hover effects and tooltip for matched areas
			if (!properties.__matched) {
				// Clear any previous hover state
				if (this.hoveredFeatureId !== undefined) {
					map.setFeatureState(
						{ source: this.sourceId, id: this.hoveredFeatureId },
						{ hover: false }
					);
					this.hoveredFeatureId = undefined;
				}
				this.popup?.remove();
				map.getCanvas().style.cursor = '';
				return;
			}

			// Update hover state on the feature
			if (e.features.length > 0) {
				// Remove hover from previous feature
				if (this.hoveredFeatureId !== undefined && this.hoveredFeatureId !== feature.id) {
					map.setFeatureState(
						{ source: this.sourceId, id: this.hoveredFeatureId },
						{ hover: false }
					);
				}

				this.hoveredFeatureId = feature.id;

				// Set hover on current feature
				if (this.hoveredFeatureId !== undefined) {
					map.setFeatureState(
						{ source: this.sourceId, id: this.hoveredFeatureId },
						{ hover: true }
					);
				}
			}

			// Get area name from GeoJSON property (not the matching key)
			const areaName = String(properties[nameProperty] ?? 'Unknown');

			// Build value fields array
			const valueFields: TooltipField[] = [];

			// Add main value field
			const value = properties.__value;
			valueFields.push({
				label: formatFieldLabel(valueColumn),
				value: value,
				format: props.value_fmt ?? 'num'
			});

			// Add custom tooltip fields
			if (props.tooltip_fields) {
				for (const field of props.tooltip_fields) {
					const fieldColumn = processColumnExpression({ value: field }, this.dialect).alias;
					const fieldValue = properties[fieldColumn];
					if (fieldValue !== undefined && fieldValue !== null) {
						valueFields.push({
							label: formatFieldLabel(fieldColumn),
							value: fieldValue,
							format: 'num'
						});
					}
				}
			}

			// Build tooltip content
			const content = buildTooltipHTML({
				title: areaName,
				valueFields
			});

			// Update popup position and content
			this.popup!.setLngLat(e.lngLat).setHTML(content).addTo(map);

			// Change cursor to pointer
			map.getCanvas().style.cursor = 'pointer';
		};

		// Hide popup on mouse leave
		this.mouseLeaveHandler = () => {
			// Remove hover state
			if (this.hoveredFeatureId !== undefined) {
				map.setFeatureState({ source: this.sourceId, id: this.hoveredFeatureId }, { hover: false });
				this.hoveredFeatureId = undefined;
			}

			map.getCanvas().style.cursor = '';
			this.popup?.remove();
		};

		map.on('mousemove', this.layerId, this.mouseMoveHandler);
		map.on('mouseleave', this.layerId, this.mouseLeaveHandler);

		// Also hide tooltip on any zoom/pan to prevent cursor getting stuck
		const hideOnInteraction = () => {
			this.popup?.remove();
			if (this.hoveredFeatureId !== undefined) {
				map.setFeatureState({ source: this.sourceId, id: this.hoveredFeatureId }, { hover: false });
				this.hoveredFeatureId = undefined;
			}
		};
		map.on('zoomstart', hideOnInteraction);
		map.on('movestart', hideOnInteraction);
	}

	removeFromMap(map: maplibregl.Map): void {
		// Remove event listeners
		if (this.mouseMoveHandler) {
			map.off('mousemove', this.layerId, this.mouseMoveHandler);
			this.mouseMoveHandler = null;
		}
		if (this.mouseLeaveHandler) {
			map.off('mouseleave', this.layerId, this.mouseLeaveHandler);
			this.mouseLeaveHandler = null;
		}

		// Remove popup
		this.popup?.remove();
		this.popup = null;

		// Remove layers
		if (map.getLayer(`${this.layerId}-border`)) {
			map.removeLayer(`${this.layerId}-border`);
		}
		if (map.getLayer(this.layerId)) {
			map.removeLayer(this.layerId);
		}
		if (map.getSource(this.sourceId)) {
			map.removeSource(this.sourceId);
		}

		// Reset reactive state for legend
		this.isAddedToMap = false;
		this.colorScale = null;
		this.valueColumn = 'value';
		this.minValue = null;
		this.maxValue = null;
		this.midpoint = null;
		this.colorDomain = null;
	}
}
