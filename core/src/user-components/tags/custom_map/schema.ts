import Markdoc, { type Config, type Node } from '@markdoc/markdoc';
import type { UserComponentSchema } from '../../types';
import {
	and,
	validateInfoRequiresTitle,
	validateEmptyAttributes,
	type Validator
} from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { interpolateFrontmatterVariables } from '../../../filter-variables/VariableProcessor';
import { extractMapSource } from './extract-map-source';

/**
 * The body must contain map code. `undefined` from extractMapSource means the
 * source text wasn't available (treat as "can't check"); only a definitively
 * empty body is an error.
 */
const validateNonEmptyBody: Validator = (node, config) => {
	const source = extractMapSource(node, config);
	if (source === undefined || source.trim().length > 0) return [];
	return [
		{
			id: 'custom-map-empty-body',
			level: 'error' as const,
			message: 'custom_map needs map code in its body.',
			location: node.location
		}
	];
};

const attributes = {
	title: {
		type: String,
		required: false,
		description: 'Title shown above the map',
		supportsVariables: true,
		variableContext: 'text'
	},
	subtitle: {
		type: String,
		required: false,
		description: 'Subtitle shown below the title',
		supportsVariables: true,
		variableContext: 'text'
	},
	info: {
		type: String,
		required: false,
		description: 'Information tooltip text (can only be used with title)',
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link: {
		type: String,
		required: false,
		description: 'URL to link the info text to (can only be used with info)'
	},
	info_link_title: {
		type: String,
		required: false,
		description: 'Custom text for the info link'
	},
	token: {
		type: String,
		required: false,
		description:
			'Mapbox access token. Not required in Studio — a token is provided for you. Pass one to use your own Mapbox account. With no token, maps use keyless MapLibre.'
	},
	provider: {
		type: String,
		required: false,
		matches: ['mapbox', 'maplibre'],
		description:
			'Force a basemap provider. Defaults to Mapbox when a token is available, otherwise MapLibre.'
	},
	variables: {
		// Markdoc resolves every value (frontmatter, repeat scope, filter values)
		// BEFORE the transform runs, so the component receives already-evaluated
		// primitives. Do NOT set `render: false` — that would drop it from
		// node.transformAttributes() and the component would never see it.
		type: Object,
		required: false,
		description:
			'Page values to expose to the map as `evidence.variables` — e.g. `variables={ region=$region label="static" }` (Markdoc object syntax: whitespace-separated `key=value`, no commas). Changing a value fires `evidence.onVariablesChange(cb)` / `evidence.subscribe(cb)`.'
	},
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'custom_map',
	category: 'map',
	// The body is JavaScript, not Markdoc — opt text-level validators out of
	// walking it.
	bodyLanguage: 'javascript',
	selfClosing: false,
	validate: and(validateNonEmptyBody, validateInfoRequiresTitle, validateEmptyAttributes()),
	description:
		'Write a map in JavaScript with Mapbox GL or MapLibre GL, using your page data. Use it when the built-in map component does not cover what you need.',
	keywords: ['map', 'mapbox', 'maplibre', 'custom map', 'geospatial', 'gl'],
	extraDocsSections: [
		{
			title: 'How it works',
			content: `The body of the tag is JavaScript that draws a map. It runs in a sandboxed iframe with three things already in scope:

- \`container\` — the element to render the map into.
- \`mapgl\` — the map library (Mapbox GL, or MapLibre GL when there is no Mapbox token). Write standard Mapbox / MapLibre code against it.
- \`evidence\` — your page's data and state: run queries, read and write filters, and follow the report theme.

A minimal map:

\`\`\`js
const map = new mapgl.Map({ container, center: [-71.06, 42.36], zoom: 9 });
map.on('idle', () => evidence.ready());
\`\`\`

From there you write the same code you would anywhere else with Mapbox GL or MapLibre GL: load data with \`evidence.query\`, add sources and layers, and import any map plugin from a CDN. Because the code runs in an isolated iframe it cannot reach the rest of the page — it interacts with the report only through \`evidence\`. The full list of what is in scope is below.`
		},
		{
			title: 'Globals available to your code',
			content: `The tag body runs as JavaScript inside an isolated iframe with these globals already in scope:

| Global | What it is |
| --- | --- |
| \`container\` | The element to mount your map into. |
| \`mapgl\` | The active map library — Mapbox GL when a token is available, otherwise MapLibre GL. Use \`new mapgl.Map({ container, ... })\` for provider-agnostic code. |
| \`maplibregl\` | MapLibre GL, always available. |
| \`mapboxgl\` | Mapbox GL, with the access token already set. \`undefined\` when there is no token. |
| \`provider\` / \`token\` | The resolved provider and Mapbox token. |
| \`evidence.query(name)\` | Rows for a named query or \`sql\` block on the page. Returns a promise; page filters are already applied. |
| \`evidence.variables\` | Values passed via \`variables={…}\`. Always current; \`onVariablesChange\` fires on change. |
| \`evidence.onVariablesChange(cb)\` | Fires when any \`variables\` value changes. Returns an unsubscribe fn. |
| \`evidence.filters\` | \`get()\`, \`set(id, value)\`, \`create(id, value, { column })\`, \`subscribe(cb)\` — read and write page filters. |
| \`evidence.subscribe(cb)\` | Fires on any state change (variables, filters, or theme). Returns unsubscribe. |
| \`evidence.theme\` | \`{ mode, palette }\` — resolved light/dark mode and categorical palette. |
| \`evidence.onThemeChange(cb)\` | Fires on theme/mode change — swap the basemap style here for dark mode. |
| \`evidence.onResize(cb)\` | Fires when the block resizes. Call \`map.resize()\` in the callback. |
| \`evidence.onTeardown(cb)\` | Register cleanup (e.g. \`() => map.remove()\`) run before the map re-renders on an edit. |
| \`evidence.ready()\` | Signal the first render is done, so PDF/PNG export captures a finished frame. |`
		},
		{
			title: 'Basemaps and keys',
			content: `You don't need a Mapbox key in Studio. Maps render with a Mapbox basemap and the token is applied for you, so \`new mapboxgl.Map({ container })\` works with no \`accessToken\`.

Where no token is configured — such as the open-source CLI or local development — maps use **MapLibre GL** with a free OpenFreeMap basemap instead. \`mapgl\` points at whichever library is active, so \`new mapgl.Map({ container })\` works either way.

- \`provider="maplibre"\` always uses the keyless MapLibre basemap.
- \`token="..."\` uses your own Mapbox account.

Choose a basemap style for the current theme with \`evidence.theme.mode\`:

- Mapbox — \`mapbox://styles/mapbox/light-v11\`, \`mapbox://styles/mapbox/dark-v11\`
- MapLibre — \`https://tiles.openfreemap.org/styles/positron\` (light), \`https://tiles.openfreemap.org/styles/dark\`

Switch the style when the report toggles light/dark:

\`\`\`js
evidence.onThemeChange((t) => map.setStyle(styleFor(t.mode)));
\`\`\``
		},
		{
			title: 'Theming panels and overlays',
			content: `Custom panels, legends, and controls you add to the map match the report theme with these CSS variables — set for you and updated on light/dark toggle (a sandboxed iframe has no host CSS otherwise, so use these rather than assuming a background):

- \`var(--evidence-background)\` — surface background
- \`var(--evidence-foreground)\` — text
- \`var(--evidence-muted-foreground)\` — secondary text
- \`var(--evidence-border)\` — borders / dividers

\`evidence.theme.mode\` (\`light\` / \`dark\`) plus \`evidence.onThemeChange(cb)\` let you swap the basemap style to match dark mode.`
		},
		{
			title: 'Reacting to page filters and variables',
			content: `A map and the rest of the page interact in three separate ways. Pick the one that matches what you need:

**1. Filter the map's data by a page input (dropdown, date range).** A filter takes effect where a query *references* it — passing it via \`variables=\` does not filter anything. Reference it in the SQL of the query the map runs, then \`evidence.query()\` that query:

\`\`\`sql
-- city_sales (the query the map consumes)
select * from city_sales_all where {{ region_filter.filter }}
\`\`\`

\`\`\`js
const rows = await evidence.query('city_sales'); // re-runs with a region predicate when the dropdown changes
\`\`\`

Selecting the dropdown re-runs \`city_sales\`; call \`evidence.query\` again from \`evidence.subscribe\` / \`evidence.filters.subscribe\` to redraw with the filtered rows.

**2. Read a filter/variable value in map JS (labels, client-side logic — not filtering).** Pass it via \`variables=\` as a quoted \`{{ }}\` expression — use \`.literal\` for the raw value or \`.selected\` for a SQL-quoted value. This gives you the value in \`evidence.variables\`; it does not filter any query.

\`\`\`
{% custom_map height=400 variables={ region="{{ region_filter.literal }}" } %}
const label = evidence.variables.region; // e.g. show the selected region in a badge
evidence.onVariablesChange((v) => { /* re-label */ });
{% /custom_map %}
\`\`\`

**3. Write a filter back from the map (lasso/click → filter other components or a server re-query).** Use \`evidence.filters\` and reference the filter in your query's SQL — the large-dataset pattern where you can't ship every row to the browser. A viewport-driven re-query on pan/zoom:

\`\`\`js
const map = new mapgl.Map({ container, center: [-98, 39], zoom: 4 });
async function load() {
  const rows = await evidence.query('points_in_view'); // SQL references {{ min_lng.literal }} etc.
  // ...update your source with rows...
}
map.on('load', load);
map.on('moveend', () => {
  const b = map.getBounds();
  evidence.filters.set('min_lng', b.getWest());
  evidence.filters.set('max_lng', b.getEast());
  evidence.filters.set('min_lat', b.getSouth());
  evidence.filters.set('max_lat', b.getNorth());
});
evidence.filters.subscribe(load); // re-query when the bbox filters change
\`\`\`

Call \`evidence.filters.create('min_lng', -130)\` once at startup for any filter the page's SQL references before the user interacts.

When you write a selection back as a list of ids, an empty list is ambiguous — it can mean "nothing selected yet" or "selected, matched nothing." Track selection state explicitly rather than checking the array length. And because \`id IN ()\` is invalid SQL, write a value that matches no rows (e.g. \`['__none__']\`) rather than an empty array when a selection matches nothing.`
		},
		{
			title: 'PDF and PNG export',
			content: `Map tiles load after your setup code returns, so signal completion once the map has painted or export captures a blank frame:

\`\`\`js
map.on('idle', () => evidence.ready());
\`\`\`

PNG export (image download) reads the WebGL canvas, which requires \`preserveDrawingBuffer\` — custom_map turns it on for you, so image export works by default. (PDF export uses a page screenshot and needs nothing extra.) On a very heavy map you can trade image export for a small perf win by opting out:

\`\`\`js
const map = new mapgl.Map({ container, preserveDrawingBuffer: false }); // opt out: PNG blank, PDF still works
\`\`\``
		},
		{
			title: 'Adding plugins',
			content: `Import any map-ecosystem library from a CDN — mapbox-gl-draw (lasso / box select), deck.gl, turf, h3-js, and so on. They load as normal dynamic imports. A plugin with its own UI (buttons, icons) also needs its stylesheet loaded, or its controls render blank:

\`\`\`js
// load the plugin's CSS too — icons are CSS sprites
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-draw@1/dist/mapbox-gl-draw.css';
document.head.appendChild(link);

const { default: MapboxDraw } = await import('https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-draw@1/+esm');
map.addControl(new MapboxDraw());
\`\`\`

mapbox-gl-draw's controls appear only on the Mapbox provider; on MapLibre use \`@maplibre/maplibre-gl-draw\`.`
		},
		{
			title: 'Common issues',
			content: `**Blank map.** If you passed a \`token\`, check it is valid — an invalid token still loads Mapbox but then fails to fetch tiles. Remove the token to fall back to the keyless MapLibre basemap.

**Export shows a blank map.** Tiles load after your setup code returns, so call \`evidence.ready()\` once the map has painted: \`map.on('idle', () => evidence.ready())\`.

**Different basemap locally than when published.** Local development and the CLI often have no Mapbox token, so they use MapLibre while Studio uses Mapbox. Set \`PUBLIC_MAPBOX_TOKEN\` locally to match, or set \`provider\` to pin one everywhere. If you rely on a Mapbox-only plugin, pin \`provider="mapbox"\`.`
		}
	],
	attributes,
	// The body is map code, not content to render: recover its raw text into a
	// `code` prop and drop the children so nothing renders as markdown.
	// Frontmatter {{ $foo }} is substituted here; filter/query references stay
	// as {{ }} for the runtime's evidence.query path.
	transform(node: Node, config: Config) {
		const transformedAttributes = node.transformAttributes(config);
		const rawSource = extractMapSource(node, config) ?? '';
		const variables = (config as Config & { variables?: Record<string, unknown> }).variables ?? {};
		const code = rawSource.includes('{{')
			? interpolateFrontmatterVariables(rawSource, variables)
			: rawSource;
		return new Markdoc.Tag(
			'custom_map',
			{ ...transformedAttributes, code },
			[],
			node.location,
			node.lines
		);
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 320,
			minHeight: 240
		}
	},
	snippet: `{% custom_map height=400 %}
const map = new mapgl.Map({ container, center: [-71.06, 42.36], zoom: 9 });
{% /custom_map %}$0`,
	examples: [
		{
			title: 'Basic map',
			hero: true,
			example: `
{% custom_map height=400 %}
// mapgl is Mapbox GL when a token is available, else MapLibre GL.
// container and the access token are provided for you.
const map = new mapgl.Map({
  container,
  center: [-71.06, 42.36],
  zoom: 9
});
// Tiles load asynchronously — signal readiness once painted so PDF/PNG
// export captures a finished map rather than a blank frame.
map.on('idle', () => evidence.ready());
{% /custom_map %}
`
		},
		{
			title: 'Plot Evidence data as points',
			example: `
\`\`\`sql locations
select 'New York'    as name, -74.01  as lng, 40.71 as lat
union all select 'Los Angeles', -118.24, 34.05
union all select 'Chicago',      -87.63, 41.88
union all select 'Houston',      -95.37, 29.76
union all select 'Denver',      -104.99, 39.74
union all select 'Seattle',     -122.33, 47.61
union all select 'Miami',        -80.19, 25.76
\`\`\`

{% custom_map height=500 %}
const map = new mapgl.Map({ container, center: [-98, 39], zoom: 3 });
map.on('load', async () => {
  const rows = await evidence.query('locations');
  map.addSource('pts', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: rows.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: r
      }))
    }
  });
  map.addLayer({ id: 'pts', type: 'circle', source: 'pts', paint: { 'circle-radius': 5 } });
});
{% /custom_map %}
`
		},
		{
			title: 'Import a plugin (lasso / draw)',
			example: `
{% custom_map height=500 %}
// The draw control's buttons are CSS sprites — load its stylesheet or they render blank.
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-draw@1/dist/mapbox-gl-draw.css';
document.head.appendChild(link);

const { default: MapboxDraw } = await import('https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-draw@1/+esm');
const map = new mapgl.Map({ container, center: [-98, 39], zoom: 3 });
map.on('load', () => {
  map.addControl(new MapboxDraw({ displayControlsDefault: false, controls: { polygon: true, trash: true } }));
});
{% /custom_map %}
`
		}
	]
} as const satisfies UserComponentSchema;
