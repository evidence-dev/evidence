/**
 * Path the custom_map runtime bundle is served from. Every host app emits it
 * there from the shared manifest
 * (core/src/user-components/sandbox/sandbox-runtimes.js) — the filename
 * here MUST match that manifest entry's `fileName`, or the iframe loads nothing.
 */
export const SANDBOX_RUNTIME_PATH = '/sandbox/custom-map-runtime.js';
