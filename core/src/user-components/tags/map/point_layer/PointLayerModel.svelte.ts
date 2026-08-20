import type { PointLayerProps } from './PointLayer.svelte';
import type * as maplibregl from 'maplibre-gl';
import { loadMapGL, getLabelInsertionId, mapProvider, MAP_POINT_ROW_LIMIT } from '../map-gl';
import { Query } from '../../../../Query.svelte';
import { processColumnExpression } from '../../../common/sql-expression-utils';
import { extractSQLProps } from '../../../common/sql-options';
import { logger } from '../../../../shims/logger';
import type { SqlDialect } from '../../../../sql-dialect';
import {
	createColorScale,
	getColorForValue,
	createCategoricalColorMap,
	getColorForCategory,
	type CategoricalColorResult
} from '../../../common/color-scale-utils';
import {
	createMapTooltip,
	buildTooltipHTML,
	formatFieldLabel,
	type TooltipField
} from '../tooltip-utils';

type Expression = maplibregl.ExpressionSpecification;
type ColorExpression = Expression | string;
type SizeExpression = Expression | number;

type FeatureProperties = {
	__id: number;
	__lat: number;
	__lng: number;
	__colorValue?: number | string; // Can be numeric or categorical
	__color?: string;
	__sizeValue?: number;
	__size?: number;
	__title?: string;
	__subtitle?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any; // Allow dynamic tooltip fields
};

// Native GL clustering tuning. clusterMaxZoom: stop clustering (show individual
// points) at/above this zoom. clusterRadius: cluster pixel radius on the tile.
const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 50;

export class PointLayerModel {
	private propsGetter: () => PointLayerProps;
	public layerId: string;
	private sourceId: string;
	// Extra layers rendered only when clustering is on (bubbles + count labels).
	private clusterLayerId: string;
	private clusterCountLayerId: string;
	query: Query;
	private popup: maplibregl.Popup | null = null;
	private mouseMoveHandler: ((e: maplibregl.MapLayerMouseEvent) => void) | null = null;
	private mouseLeaveHandler: (() => void) | null = null;
	private clusterClickHandler: ((e: maplibregl.MapLayerMouseEvent) => void) | null = null;
	private clusterEnterHandler: (() => void) | null = null;
	private clusterLeaveHandler: (() => void) | null = null;
	private hoveredFeatureId: string | number | null = null;
	private colorValueColumn: string | null = null;
	private colorMode: 'numeric' | 'categorical' | null = null;
	// Definition order index for consistent layer ordering regardless of load timing
	public definitionIndex: number;

	private dialect: SqlDialect;

	constructor(
		propsGetter: () => PointLayerProps,
		options: ConstructorParameters<typeof Query>[1],
		definitionIndex: number = 0
	) {
		this.propsGetter = propsGetter;
		this.layerId = `point-layer-${Math.random().toString(36).substr(2, 9)}`;
		this.sourceId = `point-source-${Math.random().toString(36).substr(2, 9)}`;
		this.clusterLayerId = `${this.layerId}-clusters`;
		this.clusterCountLayerId = `${this.layerId}-cluster-count`;
		this.definitionIndex = definitionIndex;
		this.dialect = options.connection.dialect;
		// Carve maps out of the default 10k limit: a WebGL point layer needs every
		// row at once (no pagination), so honor explicit limits up to the map cap.
		this.query = new Query(() => this.queryConfig, options, {
			maxUserLimit: MAP_POINT_ROW_LIMIT
		});
	}

	get props(): PointLayerProps {
		return this.propsGetter();
	}

	get clusteringEnabled(): boolean {
		return this.props.cluster === true;
	}

	private get queryConfig() {
		const props = this.props;
		const { where, having, limit, order, qualify } = extractSQLProps(props);
		// Clustering needs a large sample to be meaningful, so default to the map
		// cap when the author hasn't set an explicit limit.
		const effectiveLimit = limit ?? (this.clusteringEnabled ? MAP_POINT_ROW_LIMIT : undefined);

		const columns = [
			processColumnExpression({ value: props.lat }, this.dialect),
			processColumnExpression({ value: props.lng }, this.dialect)
		];

		if (props.color_value) {
			const colorValueProcessed = processColumnExpression(
				{ value: props.color_value },
				this.dialect
			);
			columns.push(colorValueProcessed);
		}

		if (props.size_value) {
			const sizeValueProcessed = processColumnExpression({ value: props.size_value }, this.dialect);
			columns.push(sizeValueProcessed);
		}

		if (props.point_title) {
			const pointTitleProcessed = processColumnExpression(
				{ value: props.point_title },
				this.dialect
			);
			columns.push(pointTitleProcessed);
		}

		if (props.point_subtitle) {
			const pointSubtitleProcessed = processColumnExpression(
				{ value: props.point_subtitle },
				this.dialect
			);
			columns.push(pointSubtitleProcessed);
		}

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
			// Clamp to the map cap so an over-large limit is honored at the ceiling
			// rather than tripping the engine's fallback to 2k sampling.
			limit:
				effectiveLimit !== undefined
					? Math.min(effectiveLimit, MAP_POINT_ROW_LIMIT)
					: effectiveLimit,
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
	valueColumn = $state<string>('color_value'); // For legend compatibility (expects 'valueColumn')
	isAddedToMap = $state(false);
	// Numeric color scale bounds for legend (apply min/max overrides).
	minValue = $state<number | null>(null);
	maxValue = $state<number | null>(null);
	midpoint = $state<number | null>(null);
	colorDomain = $state<number[] | null>(null);
	// Categorical color data for legend
	categoryColors = $state<Map<string, string> | null>(null);
	categories = $state<string[]>([]);
	// Size value data for legend
	sizeValueColumn = $state<string | null>(null);
	minSizeValue = $state<number | null>(null);
	maxSizeValue = $state<number | null>(null);

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
		const latProcessed = processColumnExpression({ value: props.lat }, this.dialect);
		const lngProcessed = processColumnExpression({ value: props.lng }, this.dialect);
		const latColumn = latProcessed.alias;
		const lngColumn = lngProcessed.alias;

		let colorValueColumn: string | null = null;
		let sizeValueColumn: string | null = null;
		let pointTitleColumn: string | null = null;
		let pointSubtitleColumn: string | null = null;

		if (props.color_value) {
			const colorValueProcessed = processColumnExpression(
				{ value: props.color_value },
				this.dialect
			);
			colorValueColumn = colorValueProcessed.alias;
			this.colorValueColumn = colorValueColumn;
			logger.debug(
				{ color_value: props.color_value, colorValueColumn },
				'[PointLayer] Color value column'
			);
		}

		if (props.size_value) {
			const sizeValueProcessed = processColumnExpression({ value: props.size_value }, this.dialect);
			sizeValueColumn = sizeValueProcessed.alias;
			logger.debug(
				{ size_value: props.size_value, sizeValueColumn },
				'[PointLayer] Size value column'
			);
		}

		if (props.point_title) {
			const pointTitleProcessed = processColumnExpression(
				{ value: props.point_title },
				this.dialect
			);
			pointTitleColumn = pointTitleProcessed.alias;
		}

		if (props.point_subtitle) {
			const pointSubtitleProcessed = processColumnExpression(
				{ value: props.point_subtitle },
				this.dialect
			);
			pointSubtitleColumn = pointSubtitleProcessed.alias;
		}

		// Detect whether color_value is numeric or categorical
		let colorScaleResult: ReturnType<typeof createColorScale> = null;
		let categoricalColorResult: CategoricalColorResult | null = null;

		if (colorValueColumn) {
			// Check if values are numeric or categorical
			const sampleValues = data
				.slice(0, Math.min(100, data.length))
				.map((row) => row[colorValueColumn]);
			const numericCount = sampleValues.filter((v) => {
				const num = Number(v);
				return !isNaN(num) && isFinite(num);
			}).length;
			const isNumeric = numericCount / sampleValues.length > 0.8; // If 80%+ are numeric, treat as numeric

			if (isNumeric) {
				// Numeric color scale (gradient)
				this.colorMode = 'numeric';
				const colorValues: number[] = [];

				data.forEach((row) => {
					const val = Number(row[colorValueColumn]);
					if (!isNaN(val) && isFinite(val)) colorValues.push(val);
				});

				colorScaleResult = createColorScale(colorValues, {
					colorPalette: props.color_palette,
					colorStops: props.color_stops,
					defaultColorScale,
					context: 'PointLayer',
					min: props.min,
					max: props.max,
					midpoint: props.midpoint
				});

				if (colorScaleResult) {
					this.colorScale = colorScaleResult.colorPalette;
					this.valueColumn = colorValueColumn ?? 'color_value';
					this.minValue = colorScaleResult.minValue;
					this.maxValue = colorScaleResult.maxValue;
					this.midpoint = colorScaleResult.midpoint;
					this.colorDomain = colorScaleResult.domain;
				}

				logger.debug(
					{ colorValueColumn, valueCount: colorValues.length, mode: 'numeric' },
					'[PointLayer] Using numeric color scale'
				);
			} else {
				// Categorical color map (discrete colors)
				this.colorMode = 'categorical';
				// Convert all values to strings (handles Date objects and other types)
				const categories = data.map((row) => {
					const val = row[colorValueColumn];
					if (val === null || val === undefined) return null;
					if (val instanceof Date) return val.toISOString();
					return val;
				});

				// Use default chart color palette for categorical data
				const defaultChartPalette = [
					'#154886',
					'#45a1bf',
					'#a5cdee',
					'#8dacbf',
					'#85c7c6',
					'#d2c6ac',
					'#f4b548',
					'#8f3d56',
					'#71b9f4',
					'#46a485'
				];

				categoricalColorResult = createCategoricalColorMap(categories, {
					colorPalette: props.color_palette,
					defaultColorPalette: defaultChartPalette,
					context: 'PointLayer'
				});

				if (categoricalColorResult) {
					this.colorScale = categoricalColorResult.colorPalette;
					this.valueColumn = colorValueColumn ?? 'color_value';
					// Store categorical data for legend
					this.categoryColors = categoricalColorResult.categoryColors;
					this.categories = categoricalColorResult.categories;
				}

				logger.debug(
					{
						colorValueColumn,
						categoryCount: categoricalColorResult?.categories.length,
						mode: 'categorical',
						categories: categoricalColorResult?.categories
					},
					'[PointLayer] Using categorical color map'
				);
			}
		}

		// Collect size values for scaling
		const sizeValues: number[] = [];
		data.forEach((row) => {
			if (sizeValueColumn) {
				const val = Number(row[sizeValueColumn]);
				if (!isNaN(val) && isFinite(val)) sizeValues.push(val);
			}
		});

		// Calculate size range for scaling
		const baseSize = props.size ?? 8;
		const sizeScale = props.size_scale ?? 1;
		const minSizeValue = sizeValues.length > 0 ? Math.min(...sizeValues) : 0;
		const maxSizeValue = sizeValues.length > 0 ? Math.max(...sizeValues) : 0;

		// Store size info for legend
		if (sizeValueColumn && sizeValues.length > 0) {
			this.sizeValueColumn = sizeValueColumn;
			this.minSizeValue = minSizeValue;
			this.maxSizeValue = maxSizeValue;
		}

		// Convert data to GeoJSON. Timed because this synchronous build is the
		// main-thread spike that stalls the page at high point counts — the
		// number to watch when tuning MAP_POINT_ROW_LIMIT. Surfaced on the
		// existing debug line below, so it adds no extra log and no prod cost.
		const buildStart = typeof performance !== 'undefined' ? performance.now() : null;
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

				// Pre-compute color using shared utility
				if (colorValueColumn) {
					if (this.colorMode === 'numeric' && colorScaleResult) {
						const colorVal = Number(row[colorValueColumn]) || 0;
						properties.__colorValue = colorVal;
						properties.__color = getColorForValue(colorVal, colorScaleResult);
					} else if (this.colorMode === 'categorical' && categoricalColorResult) {
						const rawCategory = row[colorValueColumn];
						// Convert to string for storage (handles Date and other types), filtering out null
						let category: string | number | undefined;
						if (rawCategory === null || rawCategory === undefined) {
							category = undefined;
						} else if (rawCategory instanceof Date) {
							category = rawCategory.toISOString();
						} else {
							category = rawCategory as string | number;
						}
						properties.__colorValue = category;
						properties.__color = getColorForCategory(category, categoricalColorResult);
					}
				}

				// Pre-compute size
				if (sizeValueColumn) {
					const sizeVal = Number(row[sizeValueColumn]) || 0;
					properties.__sizeValue = sizeVal;

					// Calculate size based on value
					if (maxSizeValue > minSizeValue) {
						const normalizedValue = (sizeVal - minSizeValue) / (maxSizeValue - minSizeValue);
						properties.__size = baseSize + normalizedValue * baseSize * sizeScale;
					} else {
						properties.__size = baseSize;
					}
				}

				if (pointTitleColumn) {
					properties.__title = String(row[pointTitleColumn]);
				}

				if (pointSubtitleColumn) {
					properties.__subtitle = String(row[pointSubtitleColumn]);
				}

				// Add custom tooltip fields
				if (props.tooltip_fields) {
					for (const field of props.tooltip_fields) {
						const fieldColumn = processColumnExpression({ value: field }, this.dialect).alias;
						if (row[fieldColumn] !== undefined) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							(properties as any)[fieldColumn] = row[fieldColumn];
						}
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
				rows: data.length,
				featureCount: features.length,
				clustering: this.clusteringEnabled,
				buildMs: buildStart !== null ? Math.round(performance.now() - buildStart) : undefined,
				sampleFeature: features[0]?.properties,
				colorValueColumn,
				sizeValueColumn,
				hasColorScale: !!colorScaleResult
			},
			'[PointLayer] GeoJSON created'
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
			logger.debug({ bounds: bounds.toArray() }, '[PointLayer] Calculated bounds');
		}

		// Determine color expression (use pre-computed colors from features)
		let colorExpression: ColorExpression;

		if (colorScaleResult || categoricalColorResult) {
			// Use pre-computed color from feature properties (works for both numeric and categorical)
			colorExpression = ['coalesce', ['get', '__color'], theme === 'dark' ? '#60a5fa' : '#3b82f6'];
		} else if (props.color) {
			// Single color
			colorExpression = props.color;
		} else {
			// Default color from theme
			colorExpression = theme === 'dark' ? '#60a5fa' : '#3b82f6';
		}

		// Determine size expression
		let sizeExpression: SizeExpression;

		if (sizeValueColumn && features.some((f) => f.properties?.__size !== undefined)) {
			// Use pre-computed size from feature properties
			sizeExpression = ['coalesce', ['get', '__size'], baseSize];
		} else {
			// Use base size
			sizeExpression = baseSize;
		}

		// Add source or update it if it exists. `cluster` mode is part of the
		// layer's data hash in Map.svelte, so a toggle tears the source down and
		// rebuilds it here — no need to reconcile cluster on/off on a live source.
		const clustering = this.clusteringEnabled;
		const existingSource = map.getSource(this.sourceId);
		if (!existingSource) {
			map.addSource(this.sourceId, {
				type: 'geojson',
				data: geojson,
				...(clustering
					? { cluster: true, clusterMaxZoom: CLUSTER_MAX_ZOOM, clusterRadius: CLUSTER_RADIUS }
					: {})
			});
		} else {
			// Update existing source
			(existingSource as maplibregl.GeoJSONSource).setData(geojson);
		}

		const insertBeforeId = beforeId ?? getLabelInsertionId(map);

		// Handle different shapes
		if (props.shape === 'pin') {
			// Use symbol layer for pin markers
			await this.addPinLayer(map, colorExpression, sizeExpression, theme, features, insertBeforeId);
		} else if (props.shape && ['square', 'triangle', 'star', 'diamond'].includes(props.shape)) {
			// Use symbol layer for geometric shapes
			await this.addShapeLayer(
				map,
				colorExpression,
				sizeExpression,
				theme,
				features,
				props.shape,
				insertBeforeId
			);
		} else {
			// Use circle layer for basic shapes
			const layerConfig: maplibregl.LayerSpecification = {
				id: this.layerId,
				type: 'circle',
				source: this.sourceId,
				paint: {
					'circle-radius': sizeExpression,
					'circle-color': colorExpression,
					'circle-opacity': 0.8,
					// Hover: subtle outline change
					'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 1.6, 1.1],
					'circle-stroke-color': [
						'case',
						['boolean', ['feature-state', 'hover'], false],
						theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
						theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)'
					],
					'circle-stroke-opacity': 0.55
				}
			};

			logger.debug(
				{
					layerId: this.layerId,
					paint: layerConfig.paint,
					colorExpressionType: Array.isArray(colorExpression) ? 'interpolation' : 'string',
					sizeExpressionType: Array.isArray(sizeExpression) ? 'interpolation' : 'number'
				},
				'[PointLayer] Circle layer config'
			);

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
					'[PointLayer] Circle layer added to map'
				);
			} else {
				// Update existing circle layer properties
				map.setPaintProperty(this.layerId, 'circle-radius', sizeExpression);
				map.setPaintProperty(this.layerId, 'circle-color', colorExpression);
				logger.debug(
					{ layerId: this.layerId, circleRadius: sizeExpression },
					'[PointLayer] Circle layer updated'
				);
			}
		}

		// When clustering, the main layer renders only the individual (unclustered)
		// points; bubbles + counts are drawn by the dedicated cluster layers.
		if (clustering) {
			if (map.getLayer(this.layerId)) {
				map.setFilter(this.layerId, ['!', ['has', 'point_count']]);
			}
			// Match the theme: the layer's explicit color if set, else a saturated
			// tone from the theme's default color scale, else a sensible fallback.
			const clusterColor =
				props.color ??
				defaultColorScale[Math.max(0, Math.round((defaultColorScale.length - 1) * 0.65))] ??
				(theme === 'dark' ? '#60a5fa' : '#3b82f6');
			this.addClusterLayers(map, clusterColor, theme, insertBeforeId);
		}

		// Add tooltips if enabled
		if (props.tooltip !== false) {
			this.addTooltips(
				map,
				colorValueColumn,
				sizeValueColumn,
				pointTitleColumn,
				pointSubtitleColumn
			);
		}

		// Mark as added for legend visibility
		this.isAddedToMap = true;
	}

	private createShapeSVG(shape: string, color: string, theme: 'light' | 'dark'): string {
		const size = 64;
		const strokeColor = theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)';
		const strokeWidth = 2;

		const shapes: Record<string, string> = {
			square: `<rect x="12" y="12" width="40" height="40" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="2"/>`,
			triangle: `<polygon points="32,10 58,54 6,54" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`,
			star: `<polygon points="32,8 37,26 56,26 41,37 46,55 32,44 18,55 23,37 8,26 27,26" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`,
			diamond: `<polygon points="32,8 56,32 32,56 8,32" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`
		};

		const svg = `
			<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
				${shapes[shape] || shapes.square}
			</svg>
		`;

		return svg;
	}

	private async addPinLayer(
		map: maplibregl.Map,
		colorExpression: ColorExpression,
		sizeExpression: SizeExpression,
		theme: 'light' | 'dark',
		features: GeoJSON.Feature[],
		beforeId?: string
	): Promise<void> {
		const props = this.props;
		const baseSize = props.size ?? 8;

		// Determine the color for the pin
		const pinColor =
			typeof colorExpression === 'string'
				? colorExpression
				: theme === 'dark'
					? '#60a5fa'
					: '#3b82f6';

		// Create pin SVG - clean modern map pin/marker shape, rendered at 4x for crisp scaling at large sizes
		const createPinSVG = (color: string, isDark: boolean, isHover: boolean = false) => {
			const strokeColor = isHover
				? isDark
					? 'rgba(255,255,255,0.95)'
					: 'rgba(0,0,0,0.8)'
				: isDark
					? 'rgba(0,0,0,0.4)'
					: 'rgba(255,255,255,0.9)';
			const strokeWidth = isHover ? '2.5' : '1.5';
			const innerCircleFill = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)';
			const shadowOpacity = isDark ? '0.5' : '0.3';

			const svg = `
				<svg width="192" height="256" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<filter id="shadow-${color.replace('#', '')}-${isDark ? 'dark' : 'light'}-${isHover ? 'hover' : 'normal'}" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
							<feOffset dx="0" dy="2" result="offsetblur"/>
							<feComponentTransfer>
								<feFuncA type="linear" slope="${shadowOpacity}"/>
							</feComponentTransfer>
							<feMerge>
								<feMergeNode/>
								<feMergeNode in="SourceGraphic"/>
							</feMerge>
						</filter>
					</defs>
					<g filter="url(#shadow-${color.replace('#', '')}-${isDark ? 'dark' : 'light'}-${isHover ? 'hover' : 'normal'})">
						<path d="M24 0C13.51 0 5 8.51 5 19c0 4.5 1.5 8.64 4.03 12 0 0 13.47 19.5 14.47 21 0.25 0.37 0.65 0.6 1.1 0.6 0.45 0 0.85-0.23 1.1-0.6 1-1.5 14.47-21 14.47-21 2.53-3.36 4.03-7.5 4.03-12C43 8.51 34.49 0 24 0z" 
							fill="${color}" 
							stroke="${strokeColor}" 
							stroke-width="${strokeWidth}" 
							stroke-linejoin="round"/>
						<circle cx="24" cy="19" r="6" fill="${innerCircleFill}"/>
					</g>
				</svg>
			`;
			return svg;
		};

		// For data-driven colors, create pin images for each unique color in the data
		const uniqueColors = new Set<string>();
		if (
			Array.isArray(colorExpression) &&
			(this.colorMode === 'numeric' || this.colorMode === 'categorical')
		) {
			features.forEach((f) => {
				const c = f.properties?.__color;
				if (c) uniqueColors.add(c);
			});

			for (const color of uniqueColors) {
				const imageId = `pin-${color.replace('#', '')}-${theme}`;

				if (!map.hasImage(imageId)) {
					const svg = createPinSVG(color, theme === 'dark', false);
					const img = new Image(192, 256);
					img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

					await new Promise<void>((resolve) => {
						img.onload = () => {
							if (!map.hasImage(imageId)) {
								map.addImage(imageId, img, { pixelRatio: 4 });
							}
							resolve();
						};
					});
				}
			}
		} else {
			// Single color pin
			const imageId = `pin-${pinColor.replace('#', '')}-${theme}`;

			if (!map.hasImage(imageId)) {
				const svg = createPinSVG(pinColor, theme === 'dark', false);
				const img = new Image(192, 256);
				img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

				await new Promise<void>((resolve) => {
					img.onload = () => {
						if (!map.hasImage(imageId)) {
							map.addImage(imageId, img, { pixelRatio: 4 });
						}
						resolve();
					};
				});
			}
		}

		// Create icon-image expression based on actual feature colors
		// Note: Can't use feature-state in layout properties, so we'll use paint properties for hover effects
		let iconImageExpression: Expression | string;
		if (
			Array.isArray(colorExpression) &&
			(this.colorMode === 'numeric' || this.colorMode === 'categorical')
		) {
			// Built incrementally, so type as a plain array and cast; maplibre's ExpressionSpecification
			// is a strict tuple that rejects the partial form mid-construction
			const colorToImageMap: (string | maplibregl.ExpressionSpecification)[] = [
				'match',
				['get', '__color']
			];
			// Match all unique feature colors to their pin images (use normal version only)
			uniqueColors.forEach((c) => {
				colorToImageMap.push(c, `pin-${c.replace('#', '')}-${theme}`);
			});
			// Fallback to a default pin color
			colorToImageMap.push(`pin-${pinColor.replace('#', '')}-${theme}`);
			iconImageExpression = colorToImageMap as unknown as Expression;
		} else {
			iconImageExpression = `pin-${pinColor.replace('#', '')}-${theme}`;
		}

		// Calculate icon size based on sizeExpression
		// Pin intrinsic is 48x64; use a smaller divisor to make pins visually larger
		// Note: icon-size is a layout property and doesn't support feature-state for hover effects
		const iconSizeExpression: Expression | number = Array.isArray(sizeExpression)
			? ['/', sizeExpression, 16]
			: baseSize / 16;

		const layerConfig: maplibregl.LayerSpecification = {
			id: this.layerId,
			type: 'symbol',
			source: this.sourceId,
			layout: {
				'icon-image': iconImageExpression,
				'icon-size': iconSizeExpression,
				'icon-anchor': 'bottom',
				'icon-allow-overlap': true
			},
			paint: {
				'icon-opacity': 0.9,
				// Add glow/halo effect on hover using paint properties (these support feature-state)
				'icon-halo-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 0],
				'icon-halo-color': theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)',
				'icon-halo-blur': 1
			}
		};

		// Apply zoom thresholds if provided
		if (props.zoom_threshold) {
			layerConfig.minzoom = props.zoom_threshold[0];
			layerConfig.maxzoom = props.zoom_threshold[1];
		}

		// Only add if not already present
		if (!map.getLayer(this.layerId)) {
			map.addLayer(layerConfig, beforeId);
			logger.debug({ layerId: this.layerId, beforeId }, '[PointLayer] Pin layer added to map');
		} else {
			// Update existing layer's icon-size if it changed
			map.setLayoutProperty(this.layerId, 'icon-size', iconSizeExpression);
			map.setLayoutProperty(this.layerId, 'icon-image', iconImageExpression);
			logger.debug(
				{ layerId: this.layerId, iconSize: iconSizeExpression },
				'[PointLayer] Pin layer updated'
			);
		}
	}

	private async addShapeLayer(
		map: maplibregl.Map,
		colorExpression: ColorExpression,
		sizeExpression: SizeExpression,
		theme: 'light' | 'dark',
		features: GeoJSON.Feature[],
		shape: string,
		beforeId?: string
	): Promise<void> {
		const props = this.props;
		const baseSize = props.size ?? 6;

		// Determine if we need multiple images for data-driven colors
		const uniqueColors = new Set<string>();
		if (
			Array.isArray(colorExpression) &&
			(this.colorMode === 'numeric' || this.colorMode === 'categorical')
		) {
			features.forEach((f) => {
				const c = f.properties?.__color;
				if (c) uniqueColors.add(c);
			});

			// Create a shape image for each unique color
			for (const color of uniqueColors) {
				const imageId = `shape-${shape}-${color.replace('#', '')}-${theme}`;

				if (!map.hasImage(imageId)) {
					const svg = this.createShapeSVG(shape, color, theme);
					const img = new Image(64, 64);
					img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

					await new Promise<void>((resolve) => {
						img.onload = () => {
							if (!map.hasImage(imageId)) {
								map.addImage(imageId, img, { pixelRatio: 2 });
							}
							resolve();
						};
					});
				}
			}
		} else {
			// Single color shape
			const color =
				typeof colorExpression === 'string'
					? colorExpression
					: theme === 'dark'
						? '#60a5fa'
						: '#3b82f6';
			const imageId = `shape-${shape}-${color.replace('#', '')}-${theme}`;

			if (!map.hasImage(imageId)) {
				const svg = this.createShapeSVG(shape, color, theme);
				const img = new Image(64, 64);
				img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

				await new Promise<void>((resolve) => {
					img.onload = () => {
						if (!map.hasImage(imageId)) {
							map.addImage(imageId, img, { pixelRatio: 2 });
						}
						resolve();
					};
				});
			}
		}

		// Create icon-image expression for the shape
		let iconImageExpression: Expression | string;
		if (
			Array.isArray(colorExpression) &&
			(this.colorMode === 'numeric' || this.colorMode === 'categorical')
		) {
			// Built incrementally; see pin-layer note above
			const colorToImageMap: (string | maplibregl.ExpressionSpecification)[] = [
				'match',
				['get', '__color']
			];
			uniqueColors.forEach((c) => {
				colorToImageMap.push(c, `shape-${shape}-${c.replace('#', '')}-${theme}`);
			});
			const fallbackColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
			colorToImageMap.push(`shape-${shape}-${fallbackColor.replace('#', '')}-${theme}`);
			iconImageExpression = colorToImageMap as unknown as Expression;
		} else {
			const color =
				typeof colorExpression === 'string'
					? colorExpression
					: theme === 'dark'
						? '#60a5fa'
						: '#3b82f6';
			iconImageExpression = `shape-${shape}-${color.replace('#', '')}-${theme}`;
		}

		// Create icon-size expression
		const iconSizeExpression: Expression | number = Array.isArray(sizeExpression)
			? ['/', sizeExpression, 10]
			: baseSize / 10;

		const layerConfig: maplibregl.LayerSpecification = {
			id: this.layerId,
			type: 'symbol',
			source: this.sourceId,
			layout: {
				'icon-image': iconImageExpression,
				'icon-size': iconSizeExpression,
				'icon-allow-overlap': true
			},
			paint: {
				'icon-opacity': 0.9,
				// Add glow effect on hover
				'icon-halo-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0],
				'icon-halo-color': theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
				'icon-halo-blur': 1
			}
		};

		// Apply zoom thresholds if provided
		if (props.zoom_threshold) {
			layerConfig.minzoom = props.zoom_threshold[0];
			layerConfig.maxzoom = props.zoom_threshold[1];
		}

		// Only add if not already present
		if (!map.getLayer(this.layerId)) {
			map.addLayer(layerConfig, beforeId);
			logger.debug(
				{ layerId: this.layerId, shape, beforeId },
				'[PointLayer] Shape layer added to map'
			);
		} else {
			map.setLayoutProperty(this.layerId, 'icon-size', iconSizeExpression);
			map.setLayoutProperty(this.layerId, 'icon-image', iconImageExpression);
			logger.debug(
				{ layerId: this.layerId, iconSize: iconSizeExpression },
				'[PointLayer] Shape layer updated'
			);
		}
	}

	private async addTooltips(
		map: maplibregl.Map,
		colorValueColumn: string | null,
		sizeValueColumn: string | null,
		pointTitleColumn: string | null,
		pointSubtitleColumn: string | null
	): Promise<void> {
		const props = this.props;

		// Create a popup instance
		this.popup = await createMapTooltip();

		// Show popup on hover
		this.mouseMoveHandler = (e: maplibregl.MapLayerMouseEvent) => {
			if (!e.features?.[0]) return;

			const feature = e.features[0];
			const properties = feature.properties;
			if (!properties) return;

			// Manage hover state for highlighting
			if (feature.id !== undefined && feature.id !== this.hoveredFeatureId) {
				// Clear previous hover
				if (this.hoveredFeatureId !== null) {
					map.setFeatureState(
						{ source: this.sourceId, id: this.hoveredFeatureId },
						{ hover: false }
					);
				}
				this.hoveredFeatureId = feature.id as number | string;
				map.setFeatureState({ source: this.sourceId, id: this.hoveredFeatureId }, { hover: true });
			}

			// Determine what will render
			const areValuesIdentical =
				props.color_value && props.size_value && props.color_value === props.size_value;
			const hasColorValue = !!(colorValueColumn && properties.__colorValue !== undefined);
			const hasSizeValue = !!(
				sizeValueColumn &&
				properties.__sizeValue !== undefined &&
				!areValuesIdentical
			);
			const hasTitle = !!(pointTitleColumn && properties.__title);
			const hasSubtitle = !!(pointSubtitleColumn && properties.__subtitle);

			// Build value fields array
			const valueFields: TooltipField[] = [];

			// Add color value if available
			if (hasColorValue) {
				valueFields.push({
					label: formatFieldLabel(colorValueColumn),
					value: properties.__colorValue,
					format: props.color_value_fmt ?? 'num'
				});
			}

			// Add size value if different from color value
			if (hasSizeValue) {
				valueFields.push({
					label: formatFieldLabel(sizeValueColumn),
					value: properties.__sizeValue,
					format: props.size_value_fmt ?? 'num'
				});
			}

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
				title: hasTitle ? properties.__title : undefined,
				subtitle: hasSubtitle ? properties.__subtitle : undefined,
				valueFields
			});

			// If nothing to show, skip tooltip
			if (!content) {
				return;
			}

			// Update popup position and content
			this.popup!.setLngLat(e.lngLat).setHTML(content).addTo(map);

			// Change cursor to pointer
			map.getCanvas().style.cursor = 'pointer';
		};

		// Hide popup on mouse leave
		this.mouseLeaveHandler = () => {
			map.getCanvas().style.cursor = '';
			this.popup?.remove();
			if (this.hoveredFeatureId !== null) {
				map.setFeatureState({ source: this.sourceId, id: this.hoveredFeatureId }, { hover: false });
				this.hoveredFeatureId = null;
			}
		};

		map.on('mousemove', this.layerId, this.mouseMoveHandler);
		map.on('mouseleave', this.layerId, this.mouseLeaveHandler);

		// Also hide tooltip on any zoom/pan
		const hideOnInteraction = () => {
			this.popup?.remove();
			if (this.hoveredFeatureId !== null) {
				map.setFeatureState({ source: this.sourceId, id: this.hoveredFeatureId }, { hover: false });
				this.hoveredFeatureId = null;
			}
		};
		map.on('zoomstart', hideOnInteraction);
		map.on('movestart', hideOnInteraction);
	}

	/**
	 * Cluster bubble + count layers, plus click-to-expand. Uses the source's
	 * native `cluster: true` output (`point_count`, `point_count_abbreviated`,
	 * `cluster_id`), so a cluster's count always matches the points inside it —
	 * there is no second data source to drift out of sync.
	 */
	private addClusterLayers(
		map: maplibregl.Map,
		bubbleColor: string,
		theme: 'light' | 'dark',
		beforeId?: string
	): void {
		// The basemap glyphs differ by provider: Mapbox v11 ships DIN Pro,
		// OpenFreeMap ships Noto Sans. Naming the font explicitly stops Mapbox
		// from falling back to Arial (its default "Open Sans" isn't in v11).
		const countFont =
			mapProvider === 'mapbox'
				? ['DIN Pro Medium', 'Arial Unicode MS Regular']
				: ['Noto Sans Bold'];

		if (!map.getLayer(this.clusterLayerId)) {
			map.addLayer(
				{
					id: this.clusterLayerId,
					type: 'circle',
					source: this.sourceId,
					filter: ['has', 'point_count'],
					paint: {
						'circle-color': bubbleColor,
						'circle-opacity': 0.9,
						// Grow the bubble in steps with the number of points it holds.
						'circle-radius': ['step', ['get', 'point_count'], 14, 100, 18, 1000, 24, 10000, 32],
						'circle-stroke-width': 1.5,
						'circle-stroke-color': theme === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.9)'
					}
				},
				beforeId
			);
		}

		if (!map.getLayer(this.clusterCountLayerId)) {
			map.addLayer(
				{
					id: this.clusterCountLayerId,
					type: 'symbol',
					source: this.sourceId,
					filter: ['has', 'point_count'],
					layout: {
						'text-field': ['get', 'point_count_abbreviated'],
						'text-font': countFont,
						'text-size': 12
					},
					paint: {
						'text-color': '#ffffff',
						// Subtle halo in the bubble color keeps the count legible where
						// bubbles overlap the basemap labels.
						'text-halo-color': bubbleColor,
						'text-halo-width': 1
					}
				},
				beforeId
			);
		}

		if (!this.clusterClickHandler) {
			// Click a cluster → zoom to the level where it breaks apart.
			this.clusterClickHandler = (e) => {
				const feature = map.queryRenderedFeatures(e.point, {
					layers: [this.clusterLayerId]
				})[0];
				if (!feature || feature.geometry.type !== 'Point') return;
				const clusterId = feature.properties?.cluster_id;
				if (clusterId == null) return;
				const center = feature.geometry.coordinates as [number, number];
				// A reactive rebuild can tear down the source before a queued click
				// callback runs, so guard rather than trust the cast.
				const source = map.getSource(this.sourceId) as maplibregl.GeoJSONSource | undefined;
				if (!source) return;
				// Mapbox GL takes a callback here; MapLibre GL returns a promise.
				if (mapProvider === 'maplibre') {
					source.getClusterExpansionZoom(clusterId).then(
						(zoom) => {
							if (zoom != null) map.easeTo({ center, zoom });
						},
						() => {}
					);
				} else {
					(
						source.getClusterExpansionZoom as unknown as (
							id: number,
							cb: (err: unknown, zoom: number | null) => void
						) => void
					)(clusterId, (err, zoom) => {
						if (err || zoom == null) return;
						map.easeTo({ center, zoom });
					});
				}
			};
			map.on('click', this.clusterLayerId, this.clusterClickHandler);

			this.clusterEnterHandler = () => {
				map.getCanvas().style.cursor = 'pointer';
			};
			this.clusterLeaveHandler = () => {
				map.getCanvas().style.cursor = '';
			};
			map.on('mouseenter', this.clusterLayerId, this.clusterEnterHandler);
			map.on('mouseleave', this.clusterLayerId, this.clusterLeaveHandler);
		}
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
		if (this.clusterClickHandler) {
			map.off('click', this.clusterLayerId, this.clusterClickHandler);
			this.clusterClickHandler = null;
		}
		if (this.clusterEnterHandler) {
			map.off('mouseenter', this.clusterLayerId, this.clusterEnterHandler);
			this.clusterEnterHandler = null;
		}
		if (this.clusterLeaveHandler) {
			map.off('mouseleave', this.clusterLayerId, this.clusterLeaveHandler);
			this.clusterLeaveHandler = null;
		}

		// Clear hover state
		if (this.hoveredFeatureId !== null) {
			map.setFeatureState({ source: this.sourceId, id: this.hoveredFeatureId }, { hover: false });
			this.hoveredFeatureId = null;
		}

		// Remove popup
		this.popup?.remove();
		this.popup = null;

		// Remove layers (all must go before the shared source)
		for (const id of [this.clusterCountLayerId, this.clusterLayerId, this.layerId]) {
			if (map.getLayer(id)) {
				map.removeLayer(id);
			}
		}
		if (map.getSource(this.sourceId)) {
			map.removeSource(this.sourceId);
		}

		// Reset reactive state for legend
		this.isAddedToMap = false;
		this.colorScale = null;
		this.valueColumn = 'color_value';
		this.minValue = null;
		this.maxValue = null;
		this.midpoint = null;
		this.colorDomain = null;
		this.categoryColors = null;
		this.categories = [];
		this.colorMode = null;
		this.sizeValueColumn = null;
		this.minSizeValue = null;
		this.maxSizeValue = null;
	}
}
