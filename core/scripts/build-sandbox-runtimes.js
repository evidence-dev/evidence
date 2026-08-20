#!/usr/bin/env node
/**
 * Builds every sandbox iframe runtime into `--out` (resolved against the
 * caller's cwd, so each host passes its own static dir).
 *
 * Lives in core rather than in the host apps because the runtimes are core's
 * code. When studio owned the build, the CLI shipped without the bundles
 * entirely and every `{% html %}` / `{% custom_echart %}` block 404'd its
 * runtime and rendered blank.
 *
 * Vite's lib/iife mode emits one entry per build, hence the loop.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rm } from 'node:fs/promises';
import { build } from 'vite';
import { SANDBOX_RUNTIMES } from '../src/user-components/sandbox/sandbox-runtimes.js';

const CORE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseOutDir(argv) {
	const flag = argv.indexOf('--out');
	if (flag === -1 || !argv[flag + 1]) {
		throw new Error(
			'Usage: build-sandbox-runtimes.js --out <dir> [--watch]  (dir relative to cwd)'
		);
	}
	return path.resolve(process.cwd(), argv[flag + 1]);
}

const argv = process.argv.slice(2);
const outDir = parseOutDir(argv);
const watch = argv.includes('--watch');

// Cleared once up front rather than per-build: `emptyOutDir` on each pass would
// wipe the runtime emitted by the previous one.
await rm(outDir, { recursive: true, force: true });

for (const runtime of SANDBOX_RUNTIMES) {
	await build({
		// `root` pins dependency resolution to core (which owns echarts,
		// html-to-image) and `configFile: false` stops Vite picking up the
		// calling host's vite.config.ts.
		root: CORE_ROOT,
		configFile: false,
		define: { 'process.env.NODE_ENV': '"production"' },
		build: {
			outDir,
			emptyOutDir: false,
			minify: true,
			target: 'es2020',
			// Returns a watcher immediately rather than blocking, so every runtime
			// gets one (the old studio-only script watched just the echart bundle).
			watch: watch ? {} : null,
			lib: {
				entry: path.resolve(CORE_ROOT, runtime.entry),
				formats: ['iife'],
				name: runtime.globalName,
				fileName: () => runtime.fileName
			},
			// Self-contained: no externals, so the iframe needs nothing but this file.
			// inlineDynamicImports keeps that true when a runtime uses `import()`
			// (custom_map lazy-loads mapbox-gl) — IIFE can't code-split, so the
			// dynamic chunk must fold into the single file. No-op for runtimes
			// without dynamic imports (echart, html).
			rollupOptions: { output: { entryFileNames: runtime.fileName, inlineDynamicImports: true } }
		}
	});
}

console.log(
	watch
		? `Watching ${SANDBOX_RUNTIMES.length} sandbox runtimes → ${outDir}`
		: `Built ${SANDBOX_RUNTIMES.length} sandbox runtimes → ${outDir}`
);
