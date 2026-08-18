/**
 * Docs command - search and read Evidence documentation
 * Uses the bundled SvelteKit server internally (no external calls needed)
 */

import type { Server as ServerType } from '@sveltejs/kit';
import type { SSRManifest } from '@sveltejs/kit';
import { printResult, resolveFormat, fail, type OutputOptions } from './output.ts';

type DocsOptions = OutputOptions;

/** Whether to render the human (pretty) view rather than machine output. */
function human(opts: OutputOptions): boolean {
	return resolveFormat(opts, 'structured') === 'table';
}

// Lazy-initialized SvelteKit server (shared across subcommands)
let _server: ServerType | null = null;

async function getServer(): Promise<ServerType> {
	if (_server) return _server;

	// @ts-ignore
	const manifestModule = await import('../manifest.js');
	const manifest: SSRManifest = manifestModule.default;

	const serverModule = await import('../server/index.js');
	const { Server } = serverModule as { Server: new (manifest: SSRManifest) => ServerType };
	_server = new Server(manifest);
	await _server.init({ env: Bun.env as Record<string, string> });

	return _server;
}

async function callRoute(path: string): Promise<Response> {
	const server = await getServer();
	const request = new Request(`http://localhost${path}`);
	return server.respond(request, { getClientAddress: () => '127.0.0.1' });
}

// ============================================================================
// List
// ============================================================================

async function docsList(options: DocsOptions): Promise<void> {
	const res = await callRoute('/api/docs/list');
	const data = await res.json();
	const components = data.components as Record<string, string[]>;

	if (!human(options)) {
		printResult({ kind: 'structured', value: components }, options);
		return;
	}

	for (const [category, names] of Object.entries(components)) {
		console.log(`  ${category}:`);
		console.log(`    ${names.join(', ')}`);
		console.log('');
	}
}

// ============================================================================
// Search
// ============================================================================

async function docsSearch(query: string, options: DocsOptions): Promise<void> {
	const res = await callRoute(`/api/docs/search?q=${encodeURIComponent(query)}`);
	const data = await res.json();
	const results = data.results as {
		path: string;
		title: string;
		category: string;
		snippet: string;
		score: number;
	}[];

	if (!human(options)) {
		const payload = results.map((r) => ({ title: r.title, path: r.path, snippet: r.snippet }));
		printResult({ kind: 'structured', value: payload }, options);
		return;
	}

	if (results.length === 0) {
		console.log(`  No results for "${query}"\n`);
		return;
	}

	console.log(`  Results for "${query}":\n`);
	for (const r of results) {
		console.log(`  ${r.title} [${r.category}]`);
		if (r.snippet) {
			const snippet = r.snippet.slice(0, 120).replace(/\n/g, ' ');
			console.log(`    ${snippet}`);
		}
		console.log(`    evidence docs read ${r.path}\n`);
	}
}

// ============================================================================
// Component
// ============================================================================

async function docsComponent(name: string, options: DocsOptions): Promise<void> {
	const res = await callRoute(`/api/docs/component/${encodeURIComponent(name)}`);

	if (!res.ok) {
		const data = await res.json();
		const avail = data.available?.length
			? ` Available components: ${data.available.join(', ')}`
			: '';
		fail(new Error(`Component "${name}" not found.${avail}`), options, 'NOT_FOUND');
	}

	const detail = await res.json();

	if (!human(options)) {
		printResult({ kind: 'structured', value: detail }, options);
		return;
	}

	const closing = detail.selfClosing ? 'self-closing (/%})' : 'has children (%} ... {% /tag %})';
	console.log(`  ${detail.name} [${detail.category}] ${closing}`);
	if (detail.description) console.log(`  ${detail.description}`);
	console.log('');

	if (detail.example) {
		console.log('  Example:');
		for (const line of detail.example.split('\n')) {
			console.log(`    ${line}`);
		}
		console.log('');
	}

	const attrs = detail.attributes as Record<
		string,
		{ type: string; required: boolean; default: unknown; description: string }
	>;
	const required = Object.entries(attrs).filter(([, a]) => a.required);
	const optional = Object.entries(attrs).filter(([, a]) => !a.required);

	if (required.length > 0) {
		console.log('  Required attributes:');
		for (const [name, attr] of required) {
			const desc = attr.description ? ` - ${attr.description}` : '';
			console.log(`    ${name} (${attr.type})${desc}`);
		}
		console.log('');
	}

	if (optional.length > 0) {
		console.log('  Optional attributes:');
		for (const [name, attr] of optional) {
			const def = attr.default !== undefined ? ` [default: ${attr.default}]` : '';
			const desc = attr.description ? ` - ${attr.description}` : '';
			console.log(`    ${name} (${attr.type})${def}${desc}`);
		}
		console.log('');
	}
}

// ============================================================================
// Read
// ============================================================================

async function docsRead(path: string, options: DocsOptions): Promise<void> {
	const res = await callRoute(`/api/docs/read/${path}`);

	if (!res.ok) {
		fail(new Error(`Doc "${path}" not found.`), options, 'NOT_FOUND');
	}

	const data = await res.json();

	// A doc page is a body of text; the default is the raw content. Only an
	// explicit JSON format wraps it as a structured payload.
	if (options.format === 'json' || options.format === 'ndjson') {
		printResult({ kind: 'structured', value: data }, options);
		return;
	}

	console.log(data.content);
}

// ============================================================================
// Main
// ============================================================================

export async function docs(
	subcommand: string,
	args: string[],
	options: DocsOptions
): Promise<void> {
	switch (subcommand) {
		case 'list': {
			await docsList(options);
			break;
		}
		case 'search': {
			const query = args.join(' ');
			if (!query) {
				console.error('  Usage: evidence docs search <query>');
				process.exit(1);
			}
			await docsSearch(query, options);
			break;
		}
		case 'component': {
			const name = args[0];
			if (!name) {
				console.error('  Usage: evidence docs component <name>');
				process.exit(1);
			}
			await docsComponent(name, options);
			break;
		}
		case 'read': {
			const path = args[0];
			if (!path) {
				console.error('  Usage: evidence docs read <path>');
				process.exit(1);
			}
			await docsRead(path, options);
			break;
		}
		default:
			console.error('  Usage: evidence docs <list|search|component|read> [args]');
			console.error('');
			console.error('  Subcommands:');
			console.error('    list                 List all components by category');
			console.error('    search <query>       Search documentation');
			console.error('    component <name>     Show component details and attributes');
			console.error('    read <path>          Read a documentation page');
			console.error('');
			console.error('  Options:');
			console.error('    --verbose            Force the human-readable view (default at a terminal)');
			console.error('    --format <fmt>       json, ndjson, csv, table');
			process.exit(1);
	}

	process.exit(0);
}
