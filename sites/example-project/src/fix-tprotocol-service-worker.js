/** This ServiceWorker adds Cache-Control=no-cache to requests loading a .parquet file on a Windows machine to prevent TProtocolException within duckdb-wasm */

// @ts-check
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

// The following line is replaced when disabling the service worker using VITE_EVIDENCE_DISABLE_WINDOWS_CACHE_SERVICE_WORKER
const disabled = false;

sw.addEventListener('activate', () => {
	if (disabled) {
		console.debug(
			'Detected VITE_EVIDENCE_DISABLE_WINDOWS_CACHE_SERVICE_WORKER. Service Worker disabled.'
		);
	}
});

sw.addEventListener('fetch', (event) => {
	if (disabled) return;
	if (!event.request.url.endsWith('.parquet')) return;

	const userAgent = event.request.headers.get('User-Agent');
	const isWindows = userAgent?.includes('Windows');
	if (!isWindows) return;

	const headers = new Headers(event.request.headers);
	headers.set('Cache-Control', 'no-cache');
	headers.set('X-Evidence-Windows-Cache-Disable', 'true');

	const newRequest = new Request(event.request.url, { headers });

	event.respondWith(fetch(newRequest));
});
