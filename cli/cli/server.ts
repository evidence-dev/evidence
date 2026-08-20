/**
 * Bun server with SvelteKit integration
 */

import { file } from 'bun';
import path from 'node:path';
import { execPath } from 'process';
import { ensureStudioServerOrExit, openBrowser } from './server.shared.ts';
// Auth logic shared with the SvelteKit hook (SSR/API traffic); the static
// branch below returns before SvelteKit runs, so it must check independently.
import { authDisabled, checkBasicAuth, SERVE_HARDENED_HEADERS } from './basic-auth.ts';

// @ts-ignore - generated at build time
import { assetMap } from './assets.generated.ts';

import type { Server as ServerType } from '@sveltejs/kit';
import type { SSRManifest } from '@sveltejs/kit';

// ============================================================================
// Initialize SvelteKit
// ============================================================================

// @ts-ignore
const manifestModule = await import('../manifest.js');
const manifest: SSRManifest = manifestModule.default;

const prerenderedRoutes = Array.from(manifest._.prerendered_routes);

const serverModule = await import('../server/index.js');
const { Server } = serverModule as { Server: new (manifest: SSRManifest) => ServerType };
const svelteKitServer = new Server(manifest);
await svelteKitServer.init({ env: Bun.env as Record<string, string> });

// ============================================================================
// Static File Handling
// ============================================================================

interface ResolvedFile {
	file: ReturnType<typeof file>;
	type: string;
	gzipped: boolean;
}

async function getFile(pathname: string): Promise<ResolvedFile | null> {
	let decodedPathname: string;
	try {
		decodedPathname = decodeURIComponent(pathname);
		if (decodedPathname.includes('../') || decodedPathname.includes('..\\')) return null;
	} catch {
		decodedPathname = pathname;
	}

	// Check embedded assets first
	const embedded = assetMap.get(decodedPathname);
	if (embedded) {
		return { file: file(embedded.path), type: embedded.type, gzipped: embedded.gzipped };
	}

	// Fallback to disk (for development or external assets)
	const binaryDir = path.dirname(execPath);
	for (const dir of ['client', 'prerendered']) {
		const externalFile = file(path.join(binaryDir, dir, decodedPathname));
		if (await externalFile.exists()) {
			return { file: externalFile, type: externalFile.type, gzipped: false };
		}
	}

	return null;
}

// Honors q-values (`gzip;q=0` rejects); an explicit gzip entry beats `*` regardless of order.
function acceptsGzip(acceptEncoding: string | null): boolean {
	if (!acceptEncoding) return false;
	let wildcard = false;
	for (const entry of acceptEncoding.split(',')) {
		const [coding, ...params] = entry.trim().split(';');
		const name = coding.trim().toLowerCase();
		if (name !== 'gzip' && name !== '*') continue;
		const q = params.map((p) => p.trim().toLowerCase()).find((p) => p.startsWith('q='));
		const accepted = !q || parseFloat(q.slice(2)) > 0;
		if (name === 'gzip') return accepted;
		wildcard = accepted;
	}
	return wildcard;
}

async function respondWithFile(
	resolved: ResolvedFile,
	req: Request,
	headers: Headers
): Promise<Response> {
	headers.set('Content-Type', resolved.type || 'application/octet-stream');
	if (!resolved.gzipped) return new Response(resolved.file, { headers });

	if (acceptsGzip(req.headers.get('accept-encoding'))) {
		headers.set('Content-Encoding', 'gzip');
		headers.set('Vary', 'Accept-Encoding');
		return new Response(resolved.file, { headers });
	}
	// Rare no-gzip client: decompress in memory rather than embedding both copies.
	const buffer = await resolved.file.arrayBuffer();
	return new Response(Bun.gunzipSync(new Uint8Array(buffer)), { headers });
}

async function handleStaticRequest(req: Request): Promise<Response | null> {
	const url = new URL(req.url);
	const headers = new Headers({
		'Cache-Control': 'max-age=0, must-revalidate'
	});

	// Check prerendered routes
	if (prerenderedRoutes.includes(url.pathname)) {
		const htmlPath = url.pathname === '/' ? '/index.html' : `${url.pathname}.html`;
		const htmlFile = await getFile(htmlPath);
		if (htmlFile) return respondWithFile({ ...htmlFile, type: htmlFile.type || 'text/html' }, req, headers);
	}

	// Check static assets
	const assetFile = await getFile(url.pathname);
	if (assetFile) {
		if (url.pathname.startsWith(`/${manifest.appDir}/immutable/`)) {
			headers.set('Cache-Control', 'public, max-age=31536000, immutable');
		}
		return respondWithFile(assetFile, req, headers);
	}

	return null;
}

// ============================================================================
// Server
// ============================================================================

export interface ServerOptions {
	port: number;
	open: boolean;
	/** Bind address; null = mode default (dev: 0.0.0.0, serve: 127.0.0.1). */
	host: string | null;
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function isServeMode(): boolean {
	return !!process.env.EVIDENCE_SERVE;
}

function basicAuthConfigured(): boolean {
	return !!(process.env.EVIDENCE_BASIC_USER && process.env.EVIDENCE_BASIC_PASSWORD);
}

// Fail closed: an internet-facing serve without perimeter auth would expose
// /api/query as an open SQL relay against the warehouse.
export function serveRequiresAuth(host: string): boolean {
	return isServeMode() && !LOCAL_HOSTS.has(host) && !basicAuthConfigured() && !authDisabled();
}

export async function startServer(options: ServerOptions): Promise<void> {
	const { port, open } = options;

	const isServe = isServeMode();
	const host = options.host ?? (isServe ? '127.0.0.1' : '0.0.0.0');

	if (serveRequiresAuth(host)) {
		console.error(
			'  ✗ Refusing to start: serving beyond localhost without auth.\n' +
				'    Set EVIDENCE_BASIC_USER and EVIDENCE_BASIC_PASSWORD, or keep --host at 127.0.0.1.\n' +
				'    On a trusted private network only, EVIDENCE_AUTH_DISABLED=true skips auth entirely.'
		);
		process.exit(1);
	}

	if (isServe && authDisabled() && !LOCAL_HOSTS.has(host)) {
		console.error(
			'\n  WARNING: Authentication disabled (EVIDENCE_AUTH_DISABLED).\n' +
				'  Every page and the query API are open to anyone who can reach this\n' +
				'  server. Use only on a trusted private network.\n'
		);
	}

	// Self-hosting needs nothing from Studio — checking reachability here would
	// hard-fail valid deployments behind an outbound firewall.
	if (!isServe) await ensureStudioServerOrExit();

	let server!: ReturnType<typeof Bun.serve>;
	let actualPort = port;
	const MAX_PORT_ATTEMPTS = 10;

	for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
		try {
			server = Bun.serve({
				port: actualPort,
				hostname: host,
				idleTimeout: 255,

				async fetch(req: Request, bunServer) {
					// Serve mode: basic auth must cover static responses too — Bun's
					// static branch returns before SvelteKit hooks run.
					if (isServe && !checkBasicAuth(req.headers.get('authorization'))) {
						return new Response('Unauthorized', {
							status: 401,
							headers: { 'WWW-Authenticate': 'Basic realm="evidence"' }
						});
					}

					// Try static assets first
					const staticResponse = await handleStaticRequest(req);
					if (staticResponse) {
						if (isServe) {
							for (const [k, v] of Object.entries(SERVE_HARDENED_HEADERS)) {
								staticResponse.headers.set(k, v);
							}
						}
						return staticResponse;
					}

					// Fall through to SvelteKit SSR
					return await svelteKitServer.respond(req, {
						getClientAddress() {
							return bunServer.requestIP(req)?.address || '127.0.0.1';
						}
					});
				},

				error(e: Error) {
					console.error('Server error:', e);
					return Response.json({ error: 'Internal Server Error' }, { status: 500 });
				}
			});
			break;
		} catch (err: unknown) {
			const error = err as { code?: string };
			if (error.code === 'EADDRINUSE') {
				if (attempt < MAX_PORT_ATTEMPTS - 1) {
					actualPort++;
					continue;
				}
				console.error(`  Ports ${port}-${actualPort} are all in use.`);
			} else {
				console.error(`  Failed to start server: ${err instanceof Error ? err.message : err}`);
			}
			process.exit(1);
		}
	}

	const url = `http://localhost:${server.port}`;
	console.log(`  Ready at ${url}\n`);
	if (isServe) {
		console.log(
			authDisabled()
				? '  Mode: serve (hardened) — auth disabled, dev reload disabled'
				: basicAuthConfigured()
					? '  Mode: serve (hardened) — basic auth enforced, dev reload disabled'
					: '  Mode: serve (hardened) — localhost only, no auth required'
		);
		console.log(`  Bound to ${host}; restart to pick up project changes.\n`);
	}

	if (open) openBrowser(url);

	// Graceful shutdown
	async function shutdown(reason: string) {
		console.info('\n  Shutting down...');
		// @ts-expect-error custom event
		process.emit('sveltekit:shutdown', reason);
		await server.stop(true);
		process.exit(0);
	}

	process.on('SIGTERM', () => shutdown('SIGTERM'));
	process.on('SIGINT', () => shutdown('SIGINT'));
}
