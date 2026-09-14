// v6's worker is CDN-hosted; pin it to the bundled npm version or the worker protocol drifts (maps render blank).
export const MAPLIBRE_GL_VERSION = '6.4.1';

export const MAPLIBRE_GL_CSS_URL = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_GL_VERSION}/dist/maplibre-gl.css`;

export const MAPLIBRE_GL_WORKER_URL = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_GL_VERSION}/dist/maplibre-gl-worker.mjs`;
