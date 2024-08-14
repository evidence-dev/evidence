/** This ServiceWorker adds Cache-Control=no-cache to requests loading a .parquet file on a Windows machine to prevent TProtocolException within duckdb-wasm */

// @ts-check
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

sw.addEventListener('fetch', async (event) => {
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
