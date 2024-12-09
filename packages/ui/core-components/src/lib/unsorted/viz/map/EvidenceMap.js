import { sharedPromise } from '@evidence-dev/sdk/utils';
import { debounce } from 'perfect-debounce';
import { fmt } from '@evidence-dev/component-utilities/formatting';
import formatTitle from '@evidence-dev/component-utilities/formatTitle';
import { initSmoothZoom } from './LeafletSmoothZoom';
import { writable, derived, readonly } from 'svelte/store';
import chroma from 'chroma-js';
import { browser } from '$app/environment';

/** @template T @typedef {import('svelte/store').Writable<T>} Writable<T> */
/** @template T @typedef {import('svelte/store').Readable<T>} Readable<T> */

/** @type {import('leaflet') | undefined} */
let Leaflet;

/**
 * Manages Leaflet maps, including the creation of markers and area layers, and handles interactions.
 */
export class EvidenceMap {
	/** @type {import('leaflet').Map | undefined} */
	#map;

	/**
	 * Manages the last clicked marker to track selection states.
	 * @type {import("leaflet").Marker}
	 */
	#lastClickedMarker = null;

	/**
	 * Stores original styles of markers to restore after changes.
	 * @type {Map<import("leaflet").Marker>}
	 */
	#markerStyles = new Map();

	/** @type {HTMLDivElement | undefined} */
	#mapEl;

	/** Handles the promises associated with the initialization of the map component. */
	#sharedPromise = sharedPromise();

	/**
	 * Manages the bounds of the map to adjust the view based on the layers added.
	 * @type {import('leaflet').Bounds}
	 */
	#bounds;

	/** Tracks whether the initial view has been set based on data bounds. */
	#initialViewSet = false;

	constructor() {
		this.#lastClickedMarker = null;
		this.#markerStyles = new Map();
	}

	/**
	 * Gets the promise indicating the completion of the map initialization.
	 * @returns {Promise<void>}
	 */
	get initPromise() {
		return this.#sharedPromise.promise;
	}

	/**
	 * Gets the HTML element associated with the map.
	 * @returns {HTMLDivElement | undefined}
	 */
	get mapEl() {
		return this.#mapEl;
	}

	/**
	 * @type {number}
	 */
	#initZoom;

	/**
	 * Initializes the map within the provided HTML element with specified starting coordinates and zoom level.
	 * @param {HTMLDivElement} mapEl - The HTML element to initialize the map in.
	 * @param {string} basemap - The URL template for the basemap.
	 * @param {import('leaflet').LatLngExpression} [startingCoords] - The starting coordinates for the map.
	 * @param {number} [startingZoom] - The starting zoom level for the map.
	 * @param {boolean} [userDefinedView=false]
	 * @param {string} [attribution] - The attribution text to display on the map.
	 * @returns {Promise<void>}
	 */
	async init(mapEl, basemap, startingCoords, startingZoom, userDefinedView = false, attribution) {
		if (!Leaflet) {
			this.#sharedPromise.start();
			Leaflet = await import('leaflet')
				.then((m) => {
					const Leaflet = m.default;
					initSmoothZoom(Leaflet); // Initialize smooth zoom after importing Leaflet
					return Leaflet;
				})
				.catch((e) => {
					this.#sharedPromise.reject(e);
				});
		}

		this.#initZoom = startingZoom;

		if (this.#mapEl) {
			const e = new Error('Evidence Map already initialized');
			this.#sharedPromise.reject(e);
			throw e;
		}

		this.#mapEl = mapEl;

		this.#map = Leaflet.map(this.#mapEl, {
			zoomControl: false,
			scrollWheelZoom: false, // disable original zoom function
			smoothWheelZoom: true, // enable smooth zoom
			smoothSensitivity: 5 // zoom speed. default is 1
		}).setView(startingCoords, startingZoom ?? 5);

		if (userDefinedView) {
			this.#initialViewSet = true; // Mark initial view as set
		}

		const processedBasemap = this.processBasemapUrl(basemap);
		Leaflet.tileLayer(processedBasemap, {
			subdomains: 'abcd',
			maxZoom: 20,
			className: '__evidence-leaflet-tile-layer__',
			attribution: attribution
		}).addTo(this.#map);

		if (!attribution) {
			this.#map.removeControl(this.#map.attributionControl);
		}

		this.#bounds = Leaflet.latLngBounds();

		this.#sharedPromise.resolve();
	}

	/**
	 * Cleans up the map by removing it from the DOM and freeing resources.
	 */
	cleanup() {
		this.#map.remove();
	}

	/**
	 * Dynamically adjusts the map's view to ensure all bounds are visible.
	 */
	updateBounds = debounce(() => {
		this.#bounds = Leaflet.latLngBounds(); // Reset bounds to recalculate

		this.#map.eachLayer((layer) => {
			if (
				layer instanceof Leaflet.Marker ||
				layer instanceof Leaflet.CircleMarker ||
				layer instanceof Leaflet.GeoJSON
			) {
				this.#bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
			}
		});

		if (this.#bounds.isValid()) {
			this.#map.fitBounds(this.#bounds, { maxZoom: 12 });
			if (this.#initZoom) this.#map.setZoom(this.#initZoom);
		} else {
			console.error('Bounds are invalid!', this.#bounds);
			throw new Error('Bounds are invalid!');
		}
	}, 100);

	/**
	 * Adds an interactive geoJSON layer to the map that responds to click events.
	 * @param {object} item - The data item associated with the area.
	 * @param {string} name - The identifier used for input interaction.
	 * @param {object} feature - GeoJSON feature data.
	 * @param {object} areaOptions - Initial styling options for the area.
	 * @param {object} selectedAreaOptions - Styling options for when the area is selected.
	 * @param {Function} onclick - Function to execute when the area is clicked.
	 * @param {Function} setInput - Function to set input data when an area is selected.
	 * @param {Function} unsetInput - Function to clear input data when an area is deselected.
	 * @param {string} [link] - URL to navigate to on area click.
	 * @returns {import('leaflet').Layer} The created geoJSON layer.
	 */
	addArea(
		item,
		name,
		feature,
		areaOptions,
		selectedAreaOptions,
		onclick,
		setInput,
		unsetInput,
		link
	) {
		if (!Leaflet) throw new Error('Leaflet is not yet available');

		if (!this.lastSelectedLayer) {
			this.lastSelectedLayer = null;
		}
		if (!this.originalStyles) {
			this.originalStyles = new Map();
		}

		const geoJsonLayer = Leaflet.geoJSON(feature, {
			...areaOptions,
			onEachFeature: (feature, layer) => {
				// Store the initial style of each layer as soon as it's created
				this.originalStyles.set(layer, areaOptions);
				layer.on('click', () => {
					if (this.lastSelectedLayer === layer) {
						layer.setStyle(this.originalStyles.get(layer)); // Restore the original style
						unsetInput(item, name);
						this.lastSelectedLayer = null;
					} else {
						if (this.lastSelectedLayer) {
							this.lastSelectedLayer.setStyle(this.originalStyles.get(this.lastSelectedLayer)); // Restore the last layer's original style
						}
						layer.bringToFront();
						layer.setStyle(selectedAreaOptions);
						setInput(item, name);
						this.lastSelectedLayer = layer;
					}
					onclick(feature);
					if (link) {
						window.location.href = link;
					}
				});
			}
		}).addTo(this.#map);

		this.#bounds.extend(geoJsonLayer.getBounds());
		if (!this.#initialViewSet) {
			this.updateBounds();
		} else {
			this.#map.setZoom(this.#initZoom ?? 5);
		}
		geoJsonLayer.bringToBack();
		return geoJsonLayer;
	}

	/**
	 * Adds a circle marker to the map.
	 * @param {object} item - The data item associated with the marker.
	 * @param {string} name - The identifier used for input interaction.
	 * @param {NonNullable<Pick<import('leaflet').CircleMarkerOptions, 'fillColor' | 'radius'>> & Partial<import('leaflet').CircleMarkerOptions>} circleOptions - Options for the circle marker.
	 * @param {object} selectedOptions - Styling options for when the marker is selected.
	 * @param {import('leaflet').LatLngExpression} coords - The coordinates for the circle marker.
	 * @param {Function} onclick - Function to execute when the marker is clicked.
	 * @param {Function} setInput - Function to set input data when a marker is selected.
	 * @param {Function} unsetInput - Function to clear input data when a marker is deselected.
	 * @param {string} [link] - URL to navigate to on marker click.
	 * @returns {import('leaflet').Marker} The created circle marker.
	 */
	addCircle(
		item,
		name,
		circleOptions,
		selectedOptions,
		coords,
		onclick,
		setInput,
		unsetInput,
		link
	) {
		if (!Leaflet) throw new Error('Leaflet is not yet available');

		//other panes start at z-index 400
		if (!this.#map.getPane(circleOptions.pane)) {
			this.#map.createPane(circleOptions.pane);

			this.#paneArray.forEach((pane, index) => {
				if (pane === circleOptions.pane) {
					this.#map.getPane(pane).style.zIndex = 400 + index;
				}
			});
		}

		// Create the marker with the appropriate pane
		const marker = Leaflet.circleMarker(coords, circleOptions);

		marker.addTo(this.#map);

		this.updateMarkerStyle(marker, circleOptions); // Initial style setting and storage

		marker.on('click', () => {
			onclick();
			if (this.#lastClickedMarker === marker) {
				// Revert to the original style
				const originalStyle = { ...this.#markerStyles.get(marker) }; // Clone to ensure no reference issues
				this.updateMarkerStyle(marker, originalStyle);
				this.#lastClickedMarker = null;
				unsetInput(name);
				onclick(null);
			} else {
				if (this.#lastClickedMarker) {
					const originalStyle = { ...this.#markerStyles.get(this.#lastClickedMarker) };
					this.updateMarkerStyle(this.#lastClickedMarker, originalStyle);
				}
				this.updateMarkerStyle(marker, selectedOptions);
				this.#lastClickedMarker = marker;
				setInput(item, name);
				onclick(marker);
			}
			marker.bringToFront();

			if (link) {
				window.location.href = link;
			}
		});

		// Extend bounds only if coords are valid
		if (coords && Array.isArray(coords) && coords.length === 2 && !this.#initialViewSet) {
			this.#bounds.extend(coords);
			this.updateBounds();
		} else {
			this.#map.setZoom(this.#initZoom ?? 5);
		}

		return marker;
	}

	/**
	 * Updates the style of a given marker and stores its original style if not already stored.
	 * @param {import('leaflet').Marker} marker - The marker to update the style for.
	 * @param {object} style - The style to apply to the marker.
	 */
	updateMarkerStyle(marker, style) {
		marker.setStyle(style);
		if (!this.#markerStyles.has(marker)) {
			this.#markerStyles.set(marker, { ...style }); // Ensure only the initial style is stored
		}
	}

	/**
	 * Builds a tooltip content string based on the provided item and tooltip configuration.
	 * @param {object} item - The data item for the tooltip.
	 * @param {Array<object>} tooltip - The tooltip configuration.
	 * @returns {string} The generated tooltip content.
	 */
	buildTooltip(item, tooltip) {
		let tooltipCode = '';

		let processedTooltip = tooltip.map((item) => ({
			id: item.id,
			title: item.title ?? item.id,
			showColumnName: item.showColumnName === undefined ? true : item.showColumnName,
			fieldClass: item.fieldClass ?? 'default-field-class', // Example default class
			valueClass: item.valueClass ?? 'default-value-class', // Example default class
			fmt: item.fmt ?? 'num0', // Default formatting
			formatColumnTitle:
				item.formatColumnTitle === undefined && item.title === undefined
					? true
					: item.formatColumnTitle,
			contentType: item.contentType ?? 'text', // Default to 'text'
			linkLabel: item.linkLabel ?? undefined
		}));

		if (processedTooltip) {
			for (let j = 0; j < processedTooltip.length; j++) {
				tooltipCode +=
					`<div class='flex justify-between items-center ${processedTooltip[j].rowClass || ''}'>` +
					(processedTooltip[j].showColumnName
						? `<span class='font-bold pr-5 ${processedTooltip[j].fieldClass}'>${processedTooltip[j].formatColumnTitle ? formatTitle(processedTooltip[j].title) : processedTooltip[j].title}</span>`
						: '') +
					(processedTooltip[j].contentType === 'link'
						? `<a href='${item[processedTooltip[j].id]}' class='${processedTooltip[j].valueClass}'>${processedTooltip[j].linkLabel ? processedTooltip[j].linkLabel : fmt(item[processedTooltip[j].id], processedTooltip[j].fmt)}</a>`
						: `<span class='${processedTooltip[j].valueClass}'>${fmt(item[processedTooltip[j].id], processedTooltip[j].fmt)}</span>`) +
					`</div>`;
			}
		}

		return tooltipCode;
	}

	/**
	 * Attaches a tooltip to a marker.
	 * @param {import('leaflet').Marker} marker - The marker to attach the tooltip to.
	 * @param {string} tooltipCode - The tooltip content.
	 * @param {import('leaflet').TooltipOptions} tooltipOptions - The tooltip options.
	 * @param {string} tooltipType - The type of the tooltip ('hover' or 'click').
	 */
	attachTooltip(marker, tooltipCode, tooltipOptions, tooltipType) {
		if (tooltipType === 'hover') {
			marker.bindTooltip(tooltipCode, tooltipOptions);
		} else if (tooltipType === 'click') {
			marker.bindPopup(tooltipCode, tooltipOptions);
		} else {
			console.error("tooltipType must be 'hover' or 'click'");
		}
	}

	/**
	 * Processes the basemap URL to handle high-resolution displays and specific file extensions.
	 * @param {string} url - The original basemap URL provided by the user.
	 * @returns {string} The processed basemap URL, adapted for different display resolutions and file formats.
	 */
	processBasemapUrl(url) {
		const pixelRatio = window.devicePixelRatio || 1;
		let newUrl = url;

		if (newUrl.includes('{r}')) {
			newUrl = newUrl.replace('{r}', pixelRatio > 1 ? '@2x' : '');
		}

		if (newUrl.includes('{ext}')) {
			newUrl = newUrl.replace('{ext}', 'png'); // Default extension
		}

		return newUrl;
	}

	/** @type {Map<string, Promise<any>>} */
	static #geoJsonCache = new Map();

	/** @type {Writable<Map<string, any | null>>} */
	#geoJsonData = writable(new Map());

	get geoJsonData() {
		return readonly(this.#geoJsonData);
	}

	allGeoJsonLoaded = derived(this.#geoJsonData, ($geoJsonData) => {
		return Array.from($geoJsonData.values()).every(Boolean);
	});

	/**
	 * @param {string} url
	 * @returns {Promise<any | undefined>} GeoJSON data
	 */
	async loadGeoJson(url) {
		const cached = EvidenceMap.#geoJsonCache.get(url);
		if (cached) return cached;

		if (!browser) return;

		const promise = fetch(url)
			.then((r) => r.json())
			.catch((e) => {
				this.#geoJsonData.update((map) => {
					map.delete(url);
					return map;
				});
				console.error(`Failed to load GeoJSON at URL '${url}': ${e}`);
			});
		EvidenceMap.#geoJsonCache.set(url, promise);

		// Set null to indicate we are loading data for this URL
		this.#geoJsonData.update((map) => map.set(url, null));
		const data = await promise;
		this.#geoJsonData.update((map) => {
			if (data) {
				map.set(url, data);
			} else {
				map.delete(url);
			}
			return map;
		});

		return data;
	}

	handleLegendValues(colorPalette, values, legendType) {
		//determine legend style
		if (legendType === 'categorical') {
			let uniqueValues = new Set(values);
			values = [...uniqueValues];
			let i = 0;

			while (colorPalette.length < values.length) {
				if (i >= colorPalette.length) i = 0;
				colorPalette.push(colorPalette[i]);
				i++;
			}
		} else if (legendType === 'scalar') {
			values.forEach((value) => {
				if (typeof value !== 'number' && value !== null) {
					console.error('Scalar legend requires numeric values or null.');
				}
				if (typeof value === 'number' && isNaN(value)) {
					console.error('Scalar legend requires valid numeric values.');
				}
			});
		}
		return values;
	}

	/** @param {import('@evidence-dev/tailwind').Theme} theme */
	handleFillColor(item, value, values, colorPalette, colorScale, theme) {
		if (!value) return theme.colors['primary'];

		if (item[value]) {
			if (typeof item[value] === 'string') {
				return colorPalette[values.indexOf(item[value])];
			} else {
				return colorScale(item[value]);
			}
		}
	}

	//handle legend data
	/**
	 * @type {import('svelte/store').Writable<"bottomLeft"|"topLeft"|"topRight"|"bottomRight">}
	 */
	#legendPosition = writable('bottomLeft');

	updateLegendPosition(position) {
		this.#legendPosition.set(position); // use set to update the value
	}

	get legendPosition() {
		let value;
		this.#legendPosition.subscribe((val) => (value = val))(); // immediately unsubscribe
		return value;
	}
	/**
	 *
	 * @type {import('svelte/store').Writable<
	 * { values: string[], colorPalette: string[], minValue: number, maxValue: number, legendType: string, valueFmt: string, chartType: string, legendId: string, value: string, legend: boolean }[]
	 * >}
	 */
	#legendData = writable([]);

	buildLegend(
		colorPalette,
		arrayOfStringValues,
		minValue,
		maxValue,
		legendType,
		valueFmt,
		chartType,
		legendId,
		value,
		legend
	) {
		const createLegendObject = () => ({
			colorPalette,
			values: arrayOfStringValues,
			minValue,
			maxValue,
			legendType,
			valueFmt,
			chartType,
			legendId,
			value,
			legend
		});

		this.#legendData.update((legendData) => {
			const existingIndex = legendData.findIndex((data) => data.legendId === legendId);

			if (existingIndex !== -1) {
				// Update existing legend
				return legendData.map((data, index) =>
					index === existingIndex ? { ...legend, ...createLegendObject() } : data
				);
			} else if (legendId !== undefined) {
				// Add new legend if legendId is defined
				return [...legendData, createLegendObject()];
			}
			// If legendId is undefined, return the original array
			return legendData;
		});
	}

	get legendData() {
		return readonly(this.#legendData);
	}

	/**
	 * @param {unknown} data
	 * @param {{ theme: import('@evidence-dev/tailwind').Theme }} opts
	 */
	async initializeData(
		data,
		{
			corordinates,
			value,
			checkInputs,
			min,
			max,
			colorPalette,
			legendType,
			valueFmt,
			chartType,
			legendId,
			legend,
			theme
		}
	) {
		await data.fetch();
		checkInputs(data, corordinates);
		let values = data.map((d) => d[value]);
		let minValue = Math.min(...values);
		let maxValue = Math.max(...values);
		let colorScale;

		if (!legendType) {
			typeof values[0] === 'number' ? (legendType = 'scalar') : (legendType = 'categorical');
		}

		if (legendType && !colorPalette) {
			colorPalette =
				legendType === 'categorical' ? theme.colorPalettes.default : theme.colorScales.default;
			colorPalette = colorPalette.map((item) => chroma(item).hex());
		}
		colorScale = chroma.scale(colorPalette).domain([min ?? minValue, max ?? maxValue]);

		if (legend && value) {
			values = this.handleLegendValues(colorPalette, values, legendType);
			this.buildLegend(
				colorPalette,
				values,
				minValue,
				maxValue,
				legendType,
				valueFmt,
				chartType,
				legendId,
				value,
				legend
			);
		}

		// Return the values, minValue, and maxValue for sharing with other functions
		return { values, colorPalette, colorScale };
	}

	/**@type {[string]} */
	#paneArray = [];

	registerPane(paneId) {
		// Add the unique legendId to the array
		this.#paneArray.push(paneId);

		return paneId;
	}

	handleInternalError(internalError) {
		if (internalError) {
			this.#internalError.set(internalError);
		}
	}

	/**@type {import('svelte/store').Writable<string | undefined>} */
	#internalError = writable(undefined);

	get internalError() {
		return readonly(this.#internalError);
	}
}
