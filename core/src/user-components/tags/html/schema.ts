import Markdoc, { type Config, type Node } from '@markdoc/markdoc';
import type { UserComponentSchema } from '../../types';
import { and, validateEmptyAttributes, type Validator } from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { extractHtmlSource } from './extract-html-source';
import { findBlockedScriptSources } from './validate-script-sources';
import {
	SCRIPT_CDN_ORIGINS,
	MAP_TILE_ORIGINS,
	IMAGE_ASSET_ORIGINS,
	DATA_FETCH_ORIGINS
} from './sandbox/html-csp';

/**
 * The body must be non-empty — an empty `{% html %}` renders nothing and is
 * almost always a mistake (e.g. the author deleted the content but left the
 * tag). Body syntax itself is NOT validated: it's arbitrary HTML+JS evaluated
 * inside the sandbox, which reports its own runtime errors.
 */
const validateNonEmptyBody: Validator = (node, config) => {
	const source = extractHtmlSource(node, config);
	// Source unavailable in this context — let the runtime handle it.
	if (source === undefined) return [];
	if (source.trim()) return [];
	return [
		{
			id: 'html-missing-body',
			level: 'error' as const,
			message:
				'html: The tag body is empty. Add HTML (and optional JavaScript) between the opening and closing html tags.',
			location: node.location
		}
	];
};

/**
 * A `<script src>` or `import` from an off-allowlist CDN is silently blocked by
 * the sandbox CSP at runtime — the library never loads and the block renders
 * blank with no obvious cause. Surface the statically-visible cases as a
 * warning at validate time so it's actionable before render. Warning, not
 * error: it never blocks (heuristic; only literal URLs are seen), and the
 * runtime CSP diagnostic still backstops dynamic loads. See
 * `validate-script-sources.ts` for the deliberately narrow scope.
 */
const validateScriptSources: Validator = (node, config) => {
	const source = extractHtmlSource(node, config);
	if (!source) return [];
	const blocked = findBlockedScriptSources(source);
	if (blocked.length === 0) return [];
	const hosts = [...new Set(blocked.map((b) => b.host))];
	const allowed = SCRIPT_CDN_ORIGINS.map((o) => o.replace(/^https:\/\//, '')).join(', ');
	return [
		{
			id: 'html-script-off-allowlist',
			level: 'warning' as const,
			message: `html: loads a script from ${hosts.join(', ')}, which ${hosts.length > 1 ? 'are' : 'is'} not on the sandbox allowlist — ${hosts.length > 1 ? 'they' : 'it'} will be blocked by CSP at runtime and the block will render blank. Load libraries from an allowlisted CDN (${allowed}), or ask an Evidence admin for a project-level allowlist entry.`,
			location: node.location
		}
	];
};

/**
 * Names the body's SCRIPT code visibly reads from `evidence.variables`: a
 * property read (`evidence.variables.name`) or a destructure
 * (`const { a, b } = evidence.variables`). Best-effort text scan — an alias
 * (`const v = evidence.variables; v.name`) or a computed key is invisible.
 * That's fine here: nothing load-bearing depends on this scan; it only powers
 * the teaching hints below, so a blind spot costs a missing hint, never a
 * missing value.
 */
export function collectScriptVariableReads(source: string): Set<string> {
	const names = new Set<string>();
	for (const m of source.matchAll(/evidence\.variables\.([A-Za-z_]\w*)/g)) names.add(m[1]);
	for (const m of source.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*evidence\.variables/g)) {
		for (const part of m[1].split(',')) {
			const name = part.split(/[:=]/)[0].trim();
			if (/^[A-Za-z_]\w*$/.test(name)) names.add(name);
		}
	}
	return names;
}

/**
 * Keys the tag explicitly passes via `variables={…}` (AST attribute keys).
 * Returns null when the keys are unknowable at validate time — `variables=$obj`
 * is an Ast.Variable whose Object.keys are AST internals, not the user's keys,
 * so treating it as "nothing passed" would flag every read.
 */
function passedVariableKeys(node: Node): Set<string> | null {
	const raw = node.attributes?.variables;
	if (!raw || typeof raw !== 'object') return new Set();
	if ('$$mdtype' in raw) return null;
	return new Set(Object.keys(raw as Record<string, unknown>));
}

/**
 * `{{ $name }}` anywhere in an html body does nothing — the body runs
 * verbatim in the sandbox — but it's the zero-shot guess every author and
 * agent makes (it works everywhere ELSE in Evidence). Teach both real
 * options, with a copy-pasteable variables= line built from the tokens found.
 */
const validateDollarTokens: Validator = (node, config) => {
	const source = extractHtmlSource(node, config);
	if (!source) return [];
	const names = new Set<string>();
	for (const m of source.matchAll(/\{\{\s*\$([A-Za-z_]\w*)\s*\}\}/g)) names.add(m[1]);
	if (names.size === 0) return [];
	const list = [...names];
	const passLine = list.map((n) => `${n}=$${n}`).join(' ');
	return [
		{
			id: 'html-dollar-token',
			level: 'warning' as const,
			message: `html: {{ $${list.join(' }} / {{ $')} }} does not interpolate inside an html block — the body runs verbatim in a sandboxed iframe. For plain text, write it in markdown OUTSIDE the block (where {{ $${list[0]} }} interpolates normally). Inside the block, pass the value on the tag and read it from a script: {% html variables={ ${passLine} } %} … evidence.variables.${list[0]}.`,
			location: node.location
		}
	];
};

/**
 * A script that reads `evidence.variables.name` when the tag doesn't pass
 * `name` gets `undefined` — silently. Only values passed via `variables={…}`
 * exist inside the sandbox, so a visible read without a matching entry is
 * always a bug; hand over the exact line to add.
 */
const validateUnpassedVariableReads: Validator = (node, config) => {
	const source = extractHtmlSource(node, config);
	if (!source) return [];
	const passed = passedVariableKeys(node);
	if (passed === null) return [];
	const missing = [...collectScriptVariableReads(source)].filter((n) => !passed.has(n));
	if (missing.length === 0) return [];
	const passLine = missing.map((n) => `${n}=$${n}`).join(' ');
	return [
		{
			id: 'html-variable-not-passed',
			level: 'warning' as const,
			message: `html: the script reads evidence.variables.${missing.join(', evidence.variables.')} but the tag does not pass ${missing.length === 1 ? 'it' : 'them'}. Only values passed via variables= exist inside the sandbox — add: {% html variables={ ${passLine} } %} (substitute the $-variable or literal you intend).`,
			location: node.location
		}
	];
};

const attributes = {
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	variables: {
		// Markdoc's built-in Object type accepts any object literal —
		// `variables={ name=$frontmatter_var label="literal" }`. Markdoc
		// resolves every value expression (frontmatter, repeat scope, account,
		// translations) BEFORE the transform runs, so what reaches the Svelte
		// component is a plain object of already-evaluated primitives. We do
		// NOT set `render: false` — that would exclude the attribute from
		// `node.transformAttributes()` and Html.svelte would never see it.
		type: Object,
		required: false,
		description:
			'Frontmatter (`$var`), filter or repeat values (`"{{ my_filter.literal }}"`), and literals to expose to the iframe as `evidence.variables`. Write `variables={ name=$frontmatter_name region="{{ region.literal }}" limit=10 }` (Markdoc object syntax: whitespace-separated `key=value`, no commas). Filter/repeat values must be quoted `{{ }}` and use a real property — `.literal` (raw) or `.selected` (quoted for SQL); there is no `.value`. Changing a value triggers `evidence.onVariablesChange(cb)` / `evidence.subscribe(cb)` inside the iframe.'
	}
} as const satisfies UserComponentSchema['attributes'];

/**
 * Build the "Network Allowlist" docs section from the CSP origin constants
 * in `html-csp.ts`. The constants are the single source of truth — if you
 * add or remove a host there, this section regenerates on the next
 * `pnpm docs:generate` run.
 */
function buildAllowlistSection(): string {
	const renderList = (origins: readonly string[]): string =>
		origins.map((o) => `- \`${o}\``).join('\n');

	return `Author code inside an \`{% html %}\` block runs in a sandboxed iframe with a content-security-policy that blocks all network traffic except to the curated hosts below. \`fetch\`, XHR, \`d3.csv\`, and \`d3.json\` work against these hosts; everything else is blocked at the browser level.

For data from the user's own report, always use \`evidence.query("query_name")\` instead — page rows live in the parent context and have no URL to fetch.

### Script CDNs

Used for loading JS libraries via \`<script src>\` or \`import\`:

${renderList(SCRIPT_CDN_ORIGINS)}

### Map tiles

Available to both \`<img>\` tag-based map libraries (Leaflet raster) and modern fetch/WebGL libraries (deck.gl, MapLibre):

${renderList(MAP_TILE_ORIGINS)}

### Images

Image-only hosts (loadable in \`<img>\` tags but not via \`fetch\`):

${renderList(IMAGE_ASSET_ORIGINS)}

### Data and public APIs

Reachable from \`fetch\`, XHR, \`d3.csv\`, \`d3.json\`. Includes GeoJSON / TopoJSON / Atlas files on the data CDNs (e.g. \`unpkg.com/world-atlas@2/countries-110m.json\`) plus keyless public-data APIs:

${renderList(DATA_FETCH_ORIGINS)}

### Need data from another host?

For data from your own warehouse, use \`evidence.query("query_name")\` — page queries aren't subject to this allowlist. To reach an external host that isn't listed, ask your Evidence admin to add a project-level allowlist entry for it.`;
}

export const schema = {
	render: 'html',
	category: 'ui',
	// The body is raw HTML+JS, not Markdoc — opt text-level validators out of
	// walking it (they'd choke on `<script>` contents and `{{ }}` template
	// syntax used by author frameworks).
	bodyLanguage: 'html',
	validate: and(
		validateNonEmptyBody,
		validateScriptSources,
		validateDollarTokens,
		validateUnpassedVariableReads,
		validateEmptyAttributes()
	),
	selfClosing: false,
	snippet: `{% html %}
<div id="my-viz"></div>
<script>
	const rows = await evidence.query("$1");
	// render with d3 / Chart.js / vanilla DOM …
	evidence.ready();
</script>
{% /html %}$0`,
	description:
		"Build custom, interactive visualizations with HTML and JavaScript — D3, Chart.js, Observable Plot, or any JS library. A fully supported way to create bespoke charts, diagrams, and widgets the built-in components don't cover.",
	keywords: [
		'html',
		'javascript',
		'js',
		'custom',
		'custom visualization',
		'bespoke',
		'interactive',
		'd3',
		'd3.js',
		'chart.js',
		'observable plot',
		'three.js',
		'svg',
		'canvas',
		'embed',
		'widget',
		'sandbox'
	],
	attributes,
	// The body is HTML source, not content to render: recover its raw text into
	// an `html` prop and drop the children so Markdoc renders nothing. The body
	// is passed through VERBATIM — no `{{ }}` interpolation — so author template
	// frameworks (Handlebars, Vue, etc.) and JS template literals survive intact.
	// Values cross into the iframe ONLY via the explicit `variables={…}`
	// attribute: the tag is a complete, auditable manifest of what the sandbox
	// (and any CDN library it loads) can read. Two scan-powered validators
	// below teach the contract at the moment it's violated. An auto-bridge and
	// a DOM-level `{{ $name }}` substitution engine were built and deliberately
	// shelved pre-GA (see sandbox/substitute-variables.ts and git history):
	// explicit-only is the reversible posture — either can be layered on later
	// without breaking components written against variables=.
	transform(node: Node, config: Config) {
		const transformedAttributes = node.transformAttributes(config);
		const html = extractHtmlSource(node, config) ?? '';
		return new Markdoc.Tag(
			'html',
			{ ...transformedAttributes, html },
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
			// Matches DEFAULT_HTML_MIN_HEIGHT (sandbox/html-protocol.ts). The block
			// autosizes to its content height; this is just a small floor so a
			// loading/empty block stays visible rather than collapsing to 0px.
			minHeight: 40
		}
	},
	extraDocsSections: [
		{
			title: 'The evidence API',
			content: `Every script inside the block can reach a single \`evidence\` object. It is the only bridge to the page — data, variables, theme, filters, and lifecycle all hang off it.

| Member | What it does |
| --- | --- |
| \`evidence.query(name)\` | Rows for a named query or \`sql\` block declared on the page. Returns a promise, and always returns the latest interpolated rows. |
| \`evidence.variables\` | Values passed on the tag via \`variables=\` (see below). Always current. |
| \`evidence.onVariablesChange(cb)\` | Fires when any \`variables\` value changes. Returns an unsubscribe fn. |
| \`evidence.theme\` | \`{ mode, palette }\` — the resolved light/dark mode and categorical color palette. |
| \`evidence.onThemeChange(cb)\` | Fires when the theme or mode changes. Returns an unsubscribe fn. |
| \`evidence.onResize(cb)\` | Fires when the block's width changes. Returns an unsubscribe fn (see Sizing). |
| \`evidence.subscribe(cb)\` | Fires on any state change — variables, filters, or theme. Returns an unsubscribe fn. |
| \`evidence.filters\` | \`get()\`, \`set(id, value)\`, \`create(id, value, { column })\`, \`subscribe(cb)\` — see Parameterizing Queries. |
| \`evidence.modal.open({ title, html })\` / \`.close()\` | Open a full-page modal the parent renders over the report, in a nested sandbox with the same \`evidence\` API. |
| \`evidence.navigate(path)\` | Navigate to another page in the app (a drill-through). Same-origin internal paths only. |
| \`evidence.ready()\` | Signal that the first render is done. Call it after async draws so PDF/PNG export captures a finished frame. |

The reliable pattern is to wrap your draw in \`async function render() { … }\`, then \`evidence.subscribe(render); await render();\` — \`evidence.query\` returns fresh rows each call, so the same function serves the first render and every reactive re-render.`
		},
		{
			title: 'Passing Variables',
			content: `The \`{% html %}\` block runs verbatim in an isolated iframe: the body is never interpolated, so the way a page-level value (frontmatter, a component attribute, a repeat-scoped value, a filter value, a literal) reaches your code is the \`variables={…}\` attribute. Nothing crosses into the sandbox that you didn't pass. Values are evaluated on the page, snapshotted into the iframe, and read as \`evidence.variables\`.

\`\`\`
---
selected_country: France
---

{% dropdown name=region values="north,south,east,west" defaultValue="north" /%}

{% html variables={
	greeting=$selected_country
	region="{{ region.literal }}"
	limit=10
} %}
<p id="msg"></p>
<script>
	const { greeting, region, limit } = evidence.variables;
	document.getElementById('msg').textContent =
		\`Hello \${greeting}! Showing top \${limit} from the \${region} region.\`;

	// React to filter / repeat-scope / frontmatter changes:
	evidence.onVariablesChange((next) => {
		document.getElementById('msg').textContent =
			\`Hello \${next.greeting}! Showing top \${next.limit} from the \${next.region} region.\`;
	});
	evidence.ready();
</script>
{% /html %}
\`\`\`

**Inside a repeat:** pass the iteration's value through with \`{{ }}\`, so each iteration gets a different \`evidence.variables\`.

\`\`\`
{% repeat id="category_repeat" data="demo.daily_orders" column="category" %}
	{% html variables={ category="{{ category_repeat }}" } %}
		<p id="c"></p>
		<script>
			document.getElementById('c').textContent = evidence.variables.category;
			evidence.ready();
		</script>
	{% /html %}
{% /repeat %}
\`\`\`

**Notes:**

- **\`{{ $x }}\` does not interpolate inside the block** — the body is verbatim. For plain text, write it in markdown outside the block (where \`{{ $x }}\` works normally); inside the block, pass the value via \`variables=\` and read \`evidence.variables.x\` from a script. Validation catches both mistakes with the exact fix.
- **Reading a value you didn't pass returns \`undefined\`** — only \`variables=\` entries exist inside the sandbox. Validation flags visible reads with no matching entry.
- **Reactivity:** \`const speed = evidence.variables.speed\` at the top of your script captures the value once — when the attribute or filter behind it changes, your constant does not. \`evidence.variables\` itself is always current, so either read it where you use it (e.g. inside your render/animation loop), or register \`evidence.onVariablesChange((vars) => { /* re-render */ })\` for structural changes. A change that arrives while nothing is listening logs a console warning explaining this.
- Values must be serializable primitives (string / number / boolean / null). Objects, arrays, and functions are dropped before the snapshot reaches the iframe — flatten them at the call site (\`start=$period.start\`), or query them through \`evidence.query()\` instead.
- \`evidence.variables\` is a snapshot; mutating the returned object doesn't change anything (each read returns a fresh shallow copy).
- For *row data*, prefer \`evidence.query("query_name")\` over packing rows into \`variables=\` — query results stream lazily and aren't limited to primitives.`
		},
		{
			title: 'Parameterizing Queries from JS',
			content: `\`evidence.query()\` takes no parameters. To re-run a query with different inputs, create a filter in your JS and reference it from the SQL: the query re-runs server-side, and the predicate is applied on the warehouse, so only matching rows enter the iframe. Prefer this over pulling a whole table and filtering client-side.

The loop has four steps:

1. **Declare** the filter in your script: \`evidence.filters.create("region", "north")\` (create it before anything \`.set\`s it).
2. **Reference** it from any sql fence with \`{{ region }}\` (quoted value) or \`{{ region.literal }}\` (raw, for numbers).
3. **Set** it from your interaction handler: \`evidence.filters.set("region", picked)\` — the query re-runs on the warehouse.
4. **React**: \`evidence.subscribe(render)\` fires when the fresh result lands; call \`evidence.query()\` again inside \`render\` to get the new rows.

\`\`\`\`
\`\`\`sql region_sales
select category, sum(total_sales) as total
from demo.daily_orders
where region = {{ region }}
group by category
order by total desc
\`\`\`

{% html %}
<select id="pick">
	<option>north</option><option>south</option><option>east</option><option>west</option>
</select>
<ul id="out"></ul>
<script>
	evidence.filters.create("region", "north");

	async function render() {
		const rows = await evidence.query("region_sales");
		document.getElementById("out").replaceChildren(
			...rows.map((r) => {
				const li = document.createElement("li");
				li.textContent = r.category + ": " + Math.round(r.total).toLocaleString();
				return li;
			})
		);
	}

	document.getElementById("pick").addEventListener("change", (e) => {
		evidence.filters.set("region", e.target.value);
	});
	evidence.subscribe(render);
	await render();
	evidence.ready();
</script>
{% /html %}
\`\`\`\`

**When not to use this:** for high-frequency interaction over a dataset that fits in memory (scrubbing an animation slider, hover highlights), fetch once with \`evidence.query()\` and filter/redraw client-side — a warehouse round-trip per frame is the wrong tool. Use the filter loop when the table is too big to pull, or when other components on the page should react too (\`evidence.filters.create(id, value, { column: "the_column" })\` makes built-in charts with \`filters="id"\` follow your selection).`
		},
		{
			title: 'Sizing and Responsiveness',
			content: `By default the block **autosizes**: it grows and shrinks to fit its content height and fills the page width. Give your content a real height so it has something to size to:

- A fixed-pixel element, or a responsive SVG sized with \`viewBox\` + \`width:100%\` + \`height:auto\` (which takes its height from the aspect ratio).
- A \`height:100%\` element has nothing to fill in autosize mode. For a chart that fills a fixed box (canvas, ECharts, and Chart.js all read the container's size), pass \`height=\` in pixels on the tag — that pins the box and makes the mount area full-height, so \`height:100%\` works.

Width reflows with the page, but a chart only follows if you build for it: scale SVGs with \`viewBox\` + \`width:100%\` (no redraw needed), or redraw from \`evidence.onResize(cb)\` (call the library's resize method in the callback for canvas/ECharts/Chart.js). A hardcoded pixel width won't reflow.

The block is an isolated iframe, so its own width is the viewport width — CSS \`@media (max-width: 480px)\` queries fire at the *block's* width, which makes them behave like container queries. Use them to reflow at narrow widths (stack columns, shrink type).

Tooltips and popovers are **clipped at the block edges** — CSS \`overflow\` can't escape the frame. Position them relative to your own container and clamp into bounds (e.g. \`left = Math.max(0, Math.min(x, mount.clientWidth - tip.offsetWidth))\`), or flip them near an edge.`
		},
		{
			title: 'Network Allowlist',
			content: buildAllowlistSection()
		}
	],
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
\`\`\`sql daily_orders
select 'Mon' as day, 120 as orders union all
select 'Tue', 180 union all
select 'Wed', 90
\`\`\`

{% html %}
<div id="bars" style="display:flex; gap:8px; align-items:flex-end; height:120px;"></div>
<script>
	// Wrap the draw in a function and register it with evidence.subscribe so
	// it re-runs whenever a filter, theme, or variable changes. evidence.query
	// always returns the latest interpolated rows, so the same function works
	// for the first render AND every subsequent reactive re-render.
	async function render() {
		const rows = await evidence.query("daily_orders");
		const max = Math.max(...rows.map((r) => r.orders));
		document.getElementById("bars").innerHTML = rows
			.map((r) => \`<div style="flex:1; background:\${evidence.theme.palette[0]}; height:\${(r.orders / max) * 100}%"></div>\`)
			.join("");
	}
	evidence.subscribe(render);
	await render();
	evidence.ready();
</script>
{% /html %}
`
		},
		{
			title: 'Responsive D3 chart from a CDN',
			example: `
{% html %}
<div id="chart"></div>
<script type="module">
	import * as d3 from "https://esm.sh/d3@7";
	const mount = document.getElementById("chart");
	// viewBox + width:100% lets the SVG scale with the container — responsive
	// with no redraw. Draw in a fixed coordinate space, then let CSS stretch it.
	const W = 400, H = 220;

	// Same pattern as the basic example: wrap the draw in a function so a
	// filter / theme change can re-run it. d3.select(...).html("") clears any
	// previous SVG before re-rendering.
	async function render() {
		const rows = await evidence.query("daily_orders");
		mount.innerHTML = "";
		const svg = d3.select(mount).append("svg")
			.attr("viewBox", \`0 0 \${W} \${H}\`)
			.attr("width", "100%")
			.attr("height", "auto");
		const x = d3.scaleBand().domain(rows.map((d) => d.day)).range([0, W]).padding(0.2);
		const y = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.orders)]).range([H, 0]);
		svg.selectAll("rect").data(rows).join("rect")
			.attr("x", (d) => x(d.day)).attr("y", (d) => y(d.orders))
			.attr("width", x.bandwidth()).attr("height", (d) => H - y(d.orders))
			.attr("fill", evidence.theme.palette[0]);
	}
	evidence.subscribe(render);
	await render();
	evidence.ready();
</script>
{% /html %}
`
		}
	]
} as const satisfies UserComponentSchema;
