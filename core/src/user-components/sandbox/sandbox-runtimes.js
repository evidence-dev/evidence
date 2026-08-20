/**
 * Every sandboxed user component's iframe runtime.
 *
 * Each entry is bundled as a self-contained IIFE and served from
 * `/sandbox/<fileName>` by every host app. The iframe runs at an opaque origin
 * (`sandbox="allow-scripts"`, no `allow-same-origin`), so it cannot import the
 * host's module graph — the runtime has to arrive as one standalone classic
 * script rather than riding along in the app bundle.
 *
 * Adding a sandboxed component means adding one entry here. Hosts build the
 * whole list, so a new component can't be wired into one host and silently
 * missing from another.
 */
export const SANDBOX_RUNTIMES = [
	{
		fileName: 'echart-runtime.js',
		globalName: 'EvidenceEChartSandbox',
		entry: 'src/user-components/tags/custom_echart/sandbox/runtime-entry.ts'
	},
	{
		fileName: 'html-runtime.js',
		globalName: 'EvidenceHtmlSandbox',
		entry: 'src/user-components/tags/html/sandbox/runtime-entry.ts'
	},
	{
		fileName: 'custom-map-runtime.js',
		globalName: 'EvidenceCustomMapSandbox',
		entry: 'src/user-components/tags/custom_map/sandbox/runtime-entry.ts'
	}
];

/** Directory each runtime is served from, relative to the host app's origin. */
export const SANDBOX_SERVE_DIR = '/sandbox';
