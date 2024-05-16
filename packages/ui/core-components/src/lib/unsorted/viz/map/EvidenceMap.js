import merge from 'lodash.merge';
import { sharedPromise } from '@evidence-dev/sdk/utils';
import debounce from 'lodash.debounce';
import { fmt } from '@evidence-dev/component-utilities/formatting';
import formatTitle from '@evidence-dev/component-utilities/formatTitle';

/** @type {import('leaflet') | undefined} */
let Leaflet;

export class EvidenceMap {
	/** @type {import('leaflet').Map | undefined} */
	#map;

	/** @type {HTMLDivElement | undefined} */
	#mapEl;

	/** @type {import("@evidence-dev/sdk/utils").SharedPromise<void>} */
	#sharedPromise = sharedPromise();

	/** @type {import('leaflet').LatLngBounds | undefined} */
	#bounds;

	/**
	 * Gets the initialization promise.
	 * @returns {Promise<void>}
	 */
	get initPromise() {
		return this.#sharedPromise.promise;
	}

	/**
	 * Gets the map element.
	 * @returns {HTMLDivElement | undefined}
	 */
	get mapEl() {
		return this.#mapEl;
	}

	/**
	 * Initializes the map.
	 * @param {HTMLDivElement} mapEl - The HTML element to initialize the map in.
	 * @param {string} basemap - The URL template for the basemap.
	 * @param {import('leaflet').LatLngExpression} startingCoords - The starting coordinates for the map.
	 * @param {number} startingZoom - The starting zoom level for the map.
	 * @returns {Promise<void>}
	 */
	async init(mapEl, basemap, startingCoords, startingZoom) {
		if (!Leaflet) {
			this.#sharedPromise.start();
			Leaflet = await import('leaflet')
				.then((m) => m.default)
				.catch((e) => {
					this.#sharedPromise.reject(e);
				});
		}

		if (this.#mapEl) {
			const e = new Error('Evidence Map already initialized');
			this.#sharedPromise.reject(e);
			throw e;
		}

		this.#mapEl = mapEl;
		this.#map = Leaflet.map(this.#mapEl, { zoomControl: false }).setView(
			startingCoords,
			startingZoom
		);

        const processedBasemap = this.processBasemapUrl(basemap);
        Leaflet.tileLayer(processedBasemap, {
			subdomains: 'abcd',
			maxZoom: 20
		}).addTo(this.#map);
		this.#map.removeControl(this.#map.attributionControl);

		// Initialize bounds
		this.#bounds = Leaflet.latLngBounds();

		this.#sharedPromise.resolve();
	}

	/**
	 * Cleans up the map instance.
	 */
	cleanup() {
		this.#map.remove();
	}

	/**
	 * Updates the map bounds.
	 * @private
	 */
	updateBounds = debounce(() => {
		if (this.#bounds.isValid()) {
			this.#map.fitBounds(this.#bounds);
		} else {
			console.error('Bounds are invalid!', this.#bounds);
			throw new Error('Bounds are invalid!');
		}
	}, 100);

	/**
	 * Adds an area to the map.
	 * @param {object} feature - The GeoJSON feature representing the area.
	 * @param {object} areaOptions - Options for the area layer.
	 * @param {Function} onclick - Callback function for the click event.
	 * @param {string} [link] - Optional link to navigate to on click.
	 * @returns {import('leaflet').Layer} The created layer.
	 */
	addArea(feature, areaOptions, onclick, link) {
		if (!Leaflet) throw new Error('Leaflet is not yet available');
		const layer = Leaflet.geoJSON(feature, areaOptions).addTo(this.#map);

		layer.on('click', () => {
			onclick();
			if (link) {
				window.location.href = link;
			}
		});

		this.#bounds.extend(layer.getBounds());
		this.updateBounds();

		layer.bringToBack();
		return layer;
	}

	/**
	 * Adds a circle marker to the map.
	 * @param {NonNullable<Pick<import('leaflet').CircleMarkerOptions, 'fillColor' | 'radius'>> & Partial<import('leaflet').CircleMarkerOptions>} circleOptions - Options for the circle marker.
	 * @param {import('leaflet').LatLngExpression} coords - The coordinates for the circle marker.
	 * @param {Function} onclick - Callback function for the click event.
	 * @param {string} [link] - Optional link to navigate to on click.
	 * @returns {import('leaflet').Marker} The created circle marker.
	 */
	addCircle(circleOptions, coords, onclick, link) {
		if (!Leaflet) throw new Error('Leaflet is not yet available');
		const marker = Leaflet.circleMarker(coords, circleOptions).addTo(this.#map);

		marker.on('click', () => {
			onclick();
			marker.bringToFront();
			if (link) {
				window.location.href = link;
			}
		});

		// Extend bounds only if coords are valid
		if (coords && Array.isArray(coords) && coords.length === 2) {
			this.#bounds.extend(coords);
			this.updateBounds();
		} else {
			console.error('Invalid coordinates', coords);
		}

		return marker;
	}

	/**
	 * Builds a tooltip content string.
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
			formatColumnTitle: item.formatColumnTitle === undefined ? true : item.formatColumnTitle,
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
     * Processes the basemap URL to include retina resolutions and correct file extensions.
     * @param {string} url - The original basemap URL provided by the user.
     * @returns {string} The processed basemap URL.
     */
    processBasemapUrl(url) {
        const pixelRatio = window.devicePixelRatio || 1;
        let newUrl = url;

        // Handling the {r} placeholder for retina displays
        if (newUrl.includes('{r}')) {
            newUrl = newUrl.replace('{r}', pixelRatio > 1 ? '@2x' : '');
        }

        // Handling the {ext} placeholder for file extensions
        if (newUrl.includes('{ext}')) {
            newUrl = newUrl.replace('{ext}', 'png');  // Assuming 'png' as default, can be dynamic based on your needs
        }

        return newUrl;
    }

}
