import type * as maplibregl from 'maplibre-gl';
import type { Action } from 'svelte/action';
import debounce from 'just-debounce-it';
import { logger } from '../../../shims/logger';
import { loadMapGL, mapProvider, basemapStyles } from './map-gl';

interface Options {
	theme: 'light' | 'dark';
	zoom: number;
	initial_position?: [number, number];
	zoomable: boolean;
	pannable: boolean;
	base_style: string;
	projection: 'globe' | 'flat';
	backgroundColor: string;
	onCreate?: (map: maplibregl.Map) => void;
	onDestroy?: () => void;
	onReady?: () => void;
	onStyleLoad?: () => void;
	onError?: (err: unknown) => void;
}

export const mapAction: Action<HTMLDivElement, Options> = (node, options) => {
	let map: maplibregl.Map | undefined;
	let resizeObserver: ResizeObserver | undefined;
	let debouncedResize: ((() => void) & { cancel: () => void }) | undefined;
	let destroyed = false;

	// Determine style based on theme, base_style and custom background
	const getMapStyle = (
		theme: 'light' | 'dark',
		baseStyle: string,
		backgroundColor: string
	): string | maplibregl.StyleSpecification => {
		if (baseStyle === 'blank') {
			// Return a minimal blank style with theme background color
			return {
				version: 8,
				sources: {},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: {
							'background-color': backgroundColor
						}
					}
				]
			} as maplibregl.StyleSpecification;
		}

		// Monochrome basemap from the active provider
		return basemapStyles[mapProvider][theme === 'dark' ? 'dark' : 'light'];
	};

	// Validate initial_position if provided
	const getValidCenter = (): [number, number] => {
		if (!options.initial_position) {
			return [-98.5795, 39.8283]; // Default: center of USA
		}

		const [lat, lng] = options.initial_position;

		// Check for valid numbers
		if (
			typeof lat !== 'number' ||
			typeof lng !== 'number' ||
			isNaN(lat) ||
			isNaN(lng) ||
			lat < -90 ||
			lat > 90 ||
			lng < -180 ||
			lng > 180
		) {
			logger.warn(
				{ initial_position: options.initial_position },
				'[Map] Invalid initial_position, using default center'
			);
			return [-98.5795, 39.8283];
		}

		return [lng, lat]; // GL expects [lng, lat]
	};

	const applyProjection = (m: maplibregl.Map, projection: 'globe' | 'flat') => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const setProjection = (m as any).setProjection.bind(m);
		if (mapProvider === 'maplibre') {
			// MapLibre's signature is { type }, not Mapbox's { name }
			setProjection({ type: projection === 'flat' ? 'mercator' : 'globe' });
		} else {
			setProjection(projection === 'flat' ? { name: 'mercator' } : { name: 'globe' });
		}
	};

	const englishOnly: maplibregl.ExpressionSpecification = [
		'coalesce',
		['get', 'name_en'],
		['get', 'name:latin'],
		['get', 'name']
	];

	// Collapse multilingual labels (latin + nonlatin stacked) to English on any OpenFreeMap style
	const applyEnglishLabels = (m: maplibregl.Map) => {
		if (mapProvider !== 'maplibre') return;
		for (const layer of m.getStyle()?.layers ?? []) {
			if (layer.type !== 'symbol') continue;
			const textField = (layer.layout as Record<string, unknown> | undefined)?.['text-field'];
			if (textField && JSON.stringify(textField).includes('name:nonlatin')) {
				m.setLayoutProperty(layer.id, 'text-field', englishOnly);
			}
		}
	};

	const makeStyleSetters = (m: maplibregl.Map) => ({
		setZoom: (id: string, minzoom: number) => {
			const layer = m.getLayer(id);
			if (layer) m.setLayerZoomRange(id, minzoom, layer.maxzoom || 24);
		},
		setPaint: (id: string, prop: string, val: unknown) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if (m.getLayer(id)) m.setPaintProperty(id, prop as any, val);
		},
		setLayout: (id: string, prop: string, val: unknown) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if (m.getLayer(id)) m.setLayoutProperty(id, prop as any, val);
		},
		setFilter: (id: string, filter: unknown) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if (m.getLayer(id)) m.setFilter(id, filter as any);
		}
	});

	// Evidence tuning of the OpenFreeMap dark basemap (MapLibre only) to match Mapbox dark-v11
	const tuneDark = (m: maplibregl.Map) => {
		const isDark =
			mapProvider === 'maplibre' && options.base_style === 'mono' && options.theme === 'dark';
		if (!isDark) return;

		const { setZoom, setPaint, setLayout, setFilter } = makeStyleSetters(m);

		// Stock dark draws maritime boundary segments (offshore lines tracing the coast); positron
		// excludes them with a maritime filter, so apply the same here
		setFilter('boundary_state', [
			'all',
			['==', ['get', 'admin_level'], 4],
			['!=', ['get', 'maritime'], 1]
		]);
		setFilter('boundary_country_z0-4', [
			'all',
			['==', ['get', 'admin_level'], 2],
			['!', ['has', 'claimed_by']],
			['!=', ['get', 'maritime'], 1]
		]);
		setFilter('boundary_country_z5-', [
			'all',
			['==', ['get', 'admin_level'], 2],
			['!=', ['get', 'maritime'], 1]
		]);

		// Stock OpenFreeMap dark paints water lighter than land; flip so land is the lighter surface
		setPaint('background', 'background-color', 'hsl(0, 0%, 16%)');
		setPaint('water', 'fill-color', 'hsl(0, 0%, 12%)');
		setPaint('waterway', 'line-color', 'hsl(0, 0%, 12%)');
		setPaint('building', 'fill-color', 'hsl(0, 0%, 12%)');
		setPaint('building', 'fill-outline-color', 'hsl(0, 0%, 9%)');
		setPaint('landuse_residential', 'fill-color', 'hsl(0, 2%, 15%)');
		setPaint('landuse_park', 'fill-color', 'hsl(0, 2%, 15%)');
		setPaint('landcover_wood', 'fill-pattern', undefined);
		setPaint('landcover_wood', 'fill-color', 'hsl(0, 2%, 15%)');
		// Stock glaciers are near-black; on the lightened land they must read as land, not holes
		setPaint('landcover_ice_shelf', 'fill-color', 'hsl(0, 0%, 17%)');
		setPaint('landcover_glacier', 'fill-color', 'hsl(0, 0%, 17%)');

		// Stock borders (21/23%) barely clear the 16% land; lift for contrast, country above state
		setPaint('boundary_country_z0-4', 'line-color', 'hsl(0, 0%, 42%)');
		setPaint('boundary_country_z5-', 'line-color', 'hsl(0, 0%, 42%)');
		setPaint('boundary_state', 'line-color', 'hsl(0, 0%, 30%)');

		// Stock roads were tinted against near-black land (motorways go #000 at z6, majors are
		// rgb(42) ≈ the new land); recolor them so they read lighter than land
		setPaint('highway_motorway_inner', 'line-color', 'hsl(0, 0%, 24%)');
		setPaint('highway_motorway_subtle', 'line-color', 'hsl(0, 0%, 22%)');
		setPaint('highway_major_inner', 'line-color', 'hsl(0, 0%, 24%)');
		setPaint('highway_major_subtle', 'line-color', 'hsl(0, 0%, 22%)');
		setPaint('highway_minor', 'line-color', 'hsl(0, 0%, 22%)');
		setPaint('highway_path', 'line-color', 'hsl(0, 0%, 20%)');
		setPaint('highway_motorway_casing', 'line-color', 'hsl(0, 0%, 13%)');
		setPaint('highway_major_casing', 'line-color', 'hsl(0, 0%, 13%)');
		setPaint('aeroway-runway', 'line-color', 'hsl(0, 0%, 13%)');
		setPaint('aeroway-runway-casing', 'line-color', 'hsl(0, 0%, 20%)');
		setPaint('aeroway-area', 'fill-color', 'hsl(0, 0%, 14%)');
		setPaint('aeroway-taxiway', 'line-color', 'hsl(0, 0%, 20%)');
		setPaint('road_pier', 'line-color', 'hsl(0, 0%, 16%)');
		setPaint('road_area_pier', 'fill-color', 'hsl(0, 0%, 16%)');

		// Stock OpenFreeMap paints every place label a flat grey; graduate them so countries read
		// muted, states/cities brightest, smaller settlements tapering down. Also sentence-case
		// (except states, which stay uppercase to match positron in light mode).
		const placeLabelColor: Record<string, string> = {
			place_country_major: 'hsl(0, 0%, 40%)',
			place_country_minor: 'hsl(0, 0%, 40%)',
			place_country_other: 'hsl(0, 0%, 40%)',
			place_state: 'hsl(0, 0%, 66%)',
			place_city_large: 'hsl(0, 0%, 66%)',
			place_city: 'hsl(0, 0%, 58%)',
			place_suburb: 'hsl(0, 0%, 54%)',
			place_town: 'hsl(0, 0%, 53%)',
			place_village: 'hsl(0, 0%, 47%)',
			place_other: 'hsl(0, 0%, 47%)'
		};
		for (const [id, color] of Object.entries(placeLabelColor)) {
			if (id !== 'place_state') setLayout(id, 'text-transform', 'none');
			setPaint(id, 'text-color', color);
			setPaint(id, 'text-halo-color', 'hsla(0, 0%, 16%, 0.7)');
		}

		setZoom('place_city', 5);
		setZoom('place_city_large', 5);
		// Stock dark shows state names from z0; hold to z3 so they appear only when zoomed in
		setZoom('place_state', 3);
		// Stock dark draws state borders from z0; hold to z3 so they don't clutter the world view
		setZoom('boundary_state', 3);
		// Country borders shouldn't show on the zoomed-out world view; hold the low-zoom layer to z1
		setZoom('boundary_country_z0-4', 1);

		// Stock dark requests a "circle-11" dot for town/city labels below z9, but that name is
		// missing from the OpenFreeMap sprite (console spam); drop the dots like positron does
		for (const id of ['place_town', 'place_city', 'place_city_large']) {
			setLayout(id, 'icon-image', '');
		}
	};

	// Evidence tuning of the positron basemap (MapLibre only): desaturated hsl(220) grey palette,
	// state borders/names at country zoom, city names held to regional zoom, quieter labels.
	const tunePositron = (m: maplibregl.Map) => {
		const isPositron =
			mapProvider === 'maplibre' && options.base_style === 'mono' && options.theme !== 'dark';
		if (!isPositron) return;

		const { setZoom, setPaint, setLayout } = makeStyleSetters(m);

		// Zoom bands: positron hides state borders below z8 and state names outside z5-8
		setZoom('boundary_3', 3);
		setZoom('label_state', 3);
		setZoom('label_city', 5);
		setZoom('label_city_capital', 5);

		// Desaturated palette
		setPaint('background', 'background-color', 'hsl(220, 3%, 99%)');
		setPaint('water', 'fill-color', '#DBDBDC');
		setPaint('waterway', 'line-color', '#DBDBDC');
		setPaint('park', 'fill-color', 'hsl(220, 5%, 92%)');
		setPaint('landcover_wood', 'fill-color', 'hsl(220, 5%, 92%)');
		setPaint('landuse_residential', 'fill-color', 'hsl(220, 2%, 96%)');
		setPaint('boundary_2', 'line-color', 'hsl(220, 0%, 70%)');
		setPaint('boundary_3', 'line-color', 'hsl(220, 1%, 71%)');
		setPaint('water_name_point_label', 'text-color', 'hsl(220, 1%, 60%)');
		setPaint('water_name_line_label', 'text-color', 'hsl(220, 1%, 60%)');

		// State names: smaller, upright, mid grey
		setLayout('label_state', 'text-size', ['interpolate', ['linear'], ['zoom'], 3, 8, 8, 12]);
		setLayout('label_state', 'text-font', ['Noto Sans Regular']);
		setPaint('label_state', 'text-color', 'hsl(220, 1%, 58%)');

		// City and country names: washed out, English only, no marker dots
		for (const id of ['label_city', 'label_city_capital', 'label_town', 'label_village']) {
			setLayout(id, 'icon-image', '');
			setLayout(id, 'text-anchor', 'center');
			setLayout(id, 'text-offset', [0, 0]);
		}
		// Cities and below match the state grey (towns/villages ship black in positron)
		for (const id of [
			'label_city',
			'label_city_capital',
			'label_town',
			'label_village',
			'label_other'
		]) {
			setPaint(id, 'text-color', 'hsl(220, 1%, 58%)');
		}
		// Country names ship in Noto Sans Bold, which dominates the muted palette
		for (const id of ['label_country_1', 'label_country_2', 'label_country_3']) {
			setPaint(id, 'text-color', 'hsl(220, 1%, 60%)');
			setLayout(id, 'text-font', ['Noto Sans Regular']);
		}
		// Soften the solid-white label halos to match the faded text
		for (const id of [
			'label_country_1',
			'label_country_2',
			'label_country_3',
			'label_state',
			'label_city',
			'label_city_capital',
			'label_town',
			'label_village',
			'label_other'
		]) {
			setPaint(id, 'text-halo-color', 'hsla(0, 0%, 100%, 0.5)');
		}
	};

	loadMapGL()
		.then((gl) => {
			if (destroyed) return;

			// Create the map with trackResize disabled so we can handle it ourselves
			const mapOptions: maplibregl.MapOptions = {
				container: node,
				style: getMapStyle(options.theme, options.base_style, options.backgroundColor),
				center: getValidCenter(),
				zoom: options.zoom,
				attributionControl: false,
				trackResize: false,
				scrollZoom: options.zoomable,
				boxZoom: options.zoomable,
				doubleClickZoom: options.zoomable,
				touchZoomRotate: options.zoomable,
				dragPan: options.pannable,
				dragRotate: false,
				keyboard: options.pannable || options.zoomable
			};
			// Required for PNG export (html-to-image reads the canvas via toDataURL).
			// MapLibre v5 nests GL context options under canvasContextAttributes; Mapbox keeps them top-level.
			if (mapProvider === 'maplibre') {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(mapOptions as any).canvasContextAttributes = { preserveDrawingBuffer: true };
			} else {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(mapOptions as any).preserveDrawingBuffer = true;
			}
			// MapLibre has no constructor projection option; it's applied on style.load instead
			if (mapProvider === 'mapbox') {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(mapOptions as any).projection =
					options.projection === 'flat' ? { name: 'mercator' } : { name: 'globe' };
			}
			const m = new gl.Map(mapOptions);
			map = m;

			// Add attribution control at bottom-right
			m.addControl(
				new gl.AttributionControl({
					compact: false,
					customAttribution: ''
				}),
				'bottom-right'
			);

			// Expose map instance on container for programmatic access (used by capture tool in dev)
			if (import.meta.env.DEV) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(node as any).__mapInstance = m;
			}

			// Call onCreate callback
			options.onCreate?.(m);

			// Handle map load
			m.on('load', () => {
				options.onReady?.();
			});

			// Handle style load (fires when style changes, e.g., light to dark)
			m.on('style.load', () => {
				// setStyle resets MapLibre's projection, so reapply on every style load
				if (mapProvider === 'maplibre') {
					applyProjection(m, options.projection);
				}
				applyEnglishLabels(m);
				tunePositron(m);
				tuneDark(m);
				options.onStyleLoad?.();
			});
			// Inline (blank) styles could finish loading before the listener registers
			if (mapProvider === 'maplibre' && m.isStyleLoaded()) {
				applyProjection(m, options.projection);
				applyEnglishLabels(m);
				tunePositron(m);
				tuneDark(m);
			}

			// Debounce resize to reduce flicker during continuous resizing
			debouncedResize = debounce(() => {
				m.resize();
			}, 150);

			// Handle resize
			resizeObserver = new ResizeObserver(() => {
				debouncedResize?.();
			});
			resizeObserver.observe(node);
		})
		.catch((err) => {
			logger.error(err, '[Map] Failed to load map renderer');
			options.onError?.(err);
		});

	return {
		update: (newOptions) => {
			// Map not created yet — creation reads the latest options
			if (!map) {
				options = newOptions;
				return;
			}
			// Update map style if theme, base_style, or backgroundColor changed
			if (
				newOptions.theme !== options.theme ||
				newOptions.base_style !== options.base_style ||
				newOptions.backgroundColor !== options.backgroundColor
			) {
				map.setStyle(
					getMapStyle(newOptions.theme, newOptions.base_style, newOptions.backgroundColor)
				);
			}
			// Update projection if changed
			if (newOptions.projection !== options.projection) {
				applyProjection(map, newOptions.projection);
			}
			// Update zoom if changed
			if (newOptions.zoom !== options.zoom) {
				map.setZoom(newOptions.zoom);
			}
			// Update center if initial_position changed
			if (
				newOptions.initial_position &&
				JSON.stringify(newOptions.initial_position) !== JSON.stringify(options.initial_position)
			) {
				map.setCenter([newOptions.initial_position[1], newOptions.initial_position[0]]);
			}
			// Update interaction handlers if changed
			if (newOptions.zoomable !== options.zoomable) {
				if (newOptions.zoomable) {
					map.scrollZoom.enable();
					map.boxZoom.enable();
					map.doubleClickZoom.enable();
					map.touchZoomRotate.enable();
				} else {
					map.scrollZoom.disable();
					map.boxZoom.disable();
					map.doubleClickZoom.disable();
					map.touchZoomRotate.disable();
				}
			}
			if (newOptions.pannable !== options.pannable) {
				if (newOptions.pannable) {
					map.dragPan.enable();
				} else {
					map.dragPan.disable();
				}
			}
			options = newOptions;
		},
		destroy: () => {
			destroyed = true;
			resizeObserver?.disconnect();
			debouncedResize?.cancel();
			map?.remove();
			options.onDestroy?.();
		}
	};
};
