/**
 * Custom SvelteKit adapter for building a single executable CLI
 * Based on jesterkit/exe-sveltekit, simplified for our needs
 */

import { join, dirname, extname } from 'path';
import { writeFile, readdir, stat, readFile, mkdir, copyFile } from 'fs/promises';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { gzipSync } from 'zlib';
import { parse, relative, normalize } from 'path';
import { createRequire } from 'node:module';

// ============================================================================
// Constants
// ============================================================================

const ADAPTER_NAME = 'evd-adapter';
const BUILD_DIR = `.svelte-kit/${ADAPTER_NAME}`;
const TARGETS_MAP = {
	'linux-x64': 'bun-linux-x64',
	'linux-x64-musl': 'bun-linux-x64-musl',
	'linux-arm64': 'bun-linux-arm64',
	'linux-arm64-musl': 'bun-linux-arm64-musl',
	'macos-arm64': 'bun-darwin-arm64',
	'darwin-arm64': 'bun-darwin-arm64',
	'darwin-x64': 'bun-darwin-x64',
	'windows-x64': 'bun-windows-x64',
	'windows-arm64': 'bun-windows-arm64',
	'macos-x64': 'bun-darwin-x64'
};

// ============================================================================
// Asset Embedding
// ============================================================================

// Compressible-by-extension; images/fonts are already compressed formats.
const GZIP_EXTENSIONS = new Set([
	'.js',
	'.mjs',
	'.css',
	'.html',
	'.json',
	'.svg',
	'.txt',
	'.xml',
	'.map',
	'.wasm',
	'.webmanifest'
]);
// Below this, gzip framing overhead eats the gain.
const GZIP_MIN_BYTES = 1024;

const MIME_BY_EXT = {
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.html': 'text/html',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain',
	'.xml': 'application/xml',
	'.map': 'application/json',
	'.wasm': 'application/wasm',
	'.webmanifest': 'application/manifest+json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.eot': 'application/vnd.ms-fontobject',
	'.pdf': 'application/pdf'
};

function mimeFor(routePath) {
	return MIME_BY_EXT[extname(routePath).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * @param {Array<{filePath: string, routePath: string, varName: string, isPrerendered: boolean, gzipped?: boolean}>} assets
 * @param {string} buildDir
 */
async function compressAssets(assets, buildDir) {
	let saved = 0;
	for (const asset of assets) {
		if (!GZIP_EXTENSIONS.has(extname(asset.routePath).toLowerCase())) continue;
		const content = await readFile(asset.filePath);
		if (content.length < GZIP_MIN_BYTES) continue;
		const compressed = gzipSync(content, { level: 9 });
		if (compressed.length >= content.length) continue;
		const gzPath = join(
			buildDir,
			'gz',
			asset.isPrerendered ? 'prerendered' : 'client',
			asset.routePath
		);
		await mkdir(dirname(gzPath), { recursive: true });
		await writeFile(gzPath, compressed);
		saved += content.length - compressed.length;
		asset.filePath = gzPath;
		asset.gzipped = true;
	}
	return saved;
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function generateVarName(filePath) {
	const { name, ext } = parse(filePath);
	let cleanName = name
		.replace(/[^a-zA-Z0-9]/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_|_$/g, '');

	if (/^[0-9]/.test(cleanName)) cleanName = `asset_${cleanName}`;
	if (!cleanName) cleanName = 'asset';

	const normalizedPath = normalize(filePath).replace(/\\/g, '/');
	const pathHash = createHash('md5').update(normalizedPath).digest('hex').slice(0, 4);
	const extSuffix = ext.replace('.', '').toUpperCase();

	return `${cleanName}_${extSuffix}_${pathHash}`;
}

/**
 * @param {string} clientDir
 * @param {string} prerenderedDir
 * @returns {Promise<Array<{filePath: string, routePath: string, varName: string, isPrerendered: boolean}>>}
 */
async function discoverAssets(clientDir, prerenderedDir) {
	/** @type {Array<{filePath: string, routePath: string, varName: string, isPrerendered: boolean}>} */
	const assets = [];

	/**
	 * @param {string} dir
	 * @param {boolean} isPrerendered
	 */
	async function walk(dir, isPrerendered) {
		const exists = await stat(dir).catch(() => false);
		if (!exists) return;

		const entries = await readdir(dir);
		for (const entry of entries) {
			const fullPath = join(dir, entry);
			const stats = await stat(fullPath);

			if (stats.isDirectory()) {
				await walk(fullPath, isPrerendered);
			} else {
				const baseDir = isPrerendered ? prerenderedDir : clientDir;
				const routePath = '/' + relative(baseDir, fullPath).replace(/\\/g, '/');
				assets.push({
					filePath: fullPath,
					routePath,
					varName: generateVarName(routePath),
					isPrerendered
				});
			}
		}
	}

	await Promise.all([walk(clientDir, false), walk(prerenderedDir, true)]);
	return assets;
}

/**
 * @param {Array<{filePath: string, routePath: string, varName: string, isPrerendered: boolean}>} assets
 * @returns {string}
 */
function generateAssetImports(assets) {
	const imports = assets
		.map((asset) => {
			const treeDir = asset.isPrerendered ? 'prerendered' : 'client';
			const relativePath = asset.gzipped
				? `../gz/${treeDir}${asset.routePath}`
				: `../${treeDir}${asset.routePath}`;
			return `import ${asset.varName} from "${relativePath}" with { type: "file" };`;
		})
		.join('\n');

	const mapEntries = assets
		.map(
			(asset) =>
				`  ["${asset.routePath}", { path: ${asset.varName}, type: "${mimeFor(asset.routePath)}", gzipped: ${asset.gzipped ? 'true' : 'false'} }]`
		)
		.join(',\n');

	return `// Auto-generated asset imports - DO NOT EDIT
// @ts-nocheck
export interface EmbeddedAsset {
	path: string;
	type: string;
	gzipped: boolean;
}

${imports}

export const assetMap: Map<string, EmbeddedAsset> = new Map([
${mapEntries}
]);
`;
}

// ============================================================================
// Adapter
// ============================================================================

/**
 * @param {{ out?: string, binaryName?: string, target?: string }} [options]
 * @returns {import('@sveltejs/kit').Adapter}
 */
export default function adapter(options = {}) {
	return {
		name: ADAPTER_NAME,

		/**
		 * @param {import('@sveltejs/kit').Builder} builder
		 */
		async adapt(builder) {
			// Allow target override from environment (for CI cross-compilation)
			const targetFromEnv = process.env.CLI_BUILD_TARGET;

			const opts = {
				out: 'dist',
				binaryName: 'evidence',
				...options,
				target: options.target || targetFromEnv
			};

			// Clean and create directories
			builder.rimraf(BUILD_DIR);
			builder.mkdirp(BUILD_DIR);
			builder.rimraf(opts.out);
			builder.mkdirp(opts.out);

			// Write SvelteKit output
			builder.writeClient(join(BUILD_DIR, 'client'));
			builder.writePrerendered(join(BUILD_DIR, 'prerendered'));
			builder.writeServer(join(BUILD_DIR, 'server'));
			builder.rimraf(join(BUILD_DIR, 'server', '_app'));
			builder.log.success('SvelteKit build complete');

			// Copy our CLI template
			const cliTemplatePath = join(process.cwd(), 'cli');
			builder.copy(cliTemplatePath, join(BUILD_DIR, 'temp-cli'));
			builder.log.success('CLI template copied');

			// Select DuckDB native assets for the target platform.
			const buildTarget = opts.target || `${process.platform}-${process.arch}`;

			const nativeTargets = {
				'linux-x64': ['linux-x64', 'libduckdb.so'],
				'linux-x64-musl': ['linux-x64-musl', 'libduckdb.so'],
				'linux-arm64': ['linux-arm64', 'libduckdb.so'],
				'linux-arm64-musl': ['linux-arm64-musl', 'libduckdb.so'],
				'darwin-x64': ['darwin-x64', 'libduckdb.dylib'],
				'darwin-arm64': ['darwin-arm64', 'libduckdb.dylib'],
				'macos-x64': ['darwin-x64', 'libduckdb.dylib'],
				'macos-arm64': ['darwin-arm64', 'libduckdb.dylib'],
				'win32-x64': ['win32-x64', 'duckdb.dll'],
				'win32-arm64': ['win32-arm64', 'duckdb.dll'],
				'windows-x64': ['win32-x64', 'duckdb.dll'],
				'windows-arm64': ['win32-arm64', 'duckdb.dll']
			};

			const native = nativeTargets[buildTarget];

			if (!native) {
				throw new Error(`Unsupported DuckDB native build target: ${buildTarget}`);
			}

			const adapterRequire = createRequire(import.meta.url);
			const apiEntry = adapterRequire.resolve('@duckdb/node-api');
			const bindingsEntry = createRequire(apiEntry).resolve('@duckdb/node-bindings');
			const nativeEntry = createRequire(bindingsEntry).resolve(
				`@duckdb/node-bindings-${native[0]}/duckdb.node`
			);

			const libraryName = native[1];
			const nativeSource = join(dirname(nativeEntry), libraryName);
			const tempCliDir = join(BUILD_DIR, 'temp-cli');

			await copyFile(nativeSource, join(tempCliDir, libraryName));

			const preloadSource = `
import embeddedLibrary from './${libraryName}' with { type: 'file' };
import { dlopen, FFIType } from 'bun:ffi';
import { createDuckDBNativeLoader } from './duckdb-native-runtime.ts';

// Keep the native handle alive for the full lifetime of the process.
const loadNative = createDuckDBNativeLoader({
    embeddedLibrary,
    libraryName: '${libraryName}',
    openLibrary: (libraryPath) => dlopen(libraryPath, {
        duckdb_library_version: { args: [], returns: FFIType.cstring }
    })
});

export async function preloadDuckDBNative() {
    await loadNative();
}
`;
			await writeFile(join(tempCliDir, 'duckdb-native.ts'), preloadSource, 'utf-8');

			builder.log.success('DuckDB native library embedded');

			// Generate manifest
			const manifest = builder.generateManifest({ relativePath: './server' });
			const manifestModule = `const manifest = ${manifest};\nexport default manifest;`;
			await writeFile(join(BUILD_DIR, 'manifest.js'), manifestModule, 'utf-8');
			builder.log.success('Manifest generated');

			// Generate asset imports (the embedding magic)
			const assets = await discoverAssets(
				join(BUILD_DIR, 'client'),
				join(BUILD_DIR, 'prerendered')
			);
			const savedBytes = await compressAssets(assets, BUILD_DIR);
			builder.log.success(`Assets gzipped (${(savedBytes / (1024 * 1024)).toFixed(1)} MB saved)`);
			const assetImports = generateAssetImports(assets);
			await writeFile(join(BUILD_DIR, 'temp-cli', 'assets.generated.ts'), assetImports, 'utf-8');
			builder.log.success(`Asset imports generated (${assets.length} files)`);

			// Compile
			const entryPoint = join(BUILD_DIR, 'temp-cli/index.ts');
			const isWindows = opts.target
				? opts.target.startsWith('windows-')
				: process.platform === 'win32';
			const outFile = join(opts.out, opts.binaryName + (isWindows ? '.exe' : ''));

			// Databricks kernel (CLI is Thrift-only) and vite (source-mode only) never load from the binary.
			const nativeBindingPackages = [...new Set(Object.values(nativeTargets).map(([pkg]) => pkg))];

			const bunArgs = [
				'build',
				'--compile',
				'--minify',
				'--external',
				'@databricks/databricks-sql-kernel-*',
				'--external',
				'vite',
				'--allow-unresolved',
				'@duckdb/node-bindings-*-*/duckdb.node',
				'--allow-unresolved',
				'', // Opaque dynamic imports in the SvelteKit SSR bundle
				...nativeBindingPackages
					.filter((target) => target !== native[0])
					.flatMap((target) => ['--external', `@duckdb/node-bindings-${target}/duckdb.node`])
			];
			if (opts.target) bunArgs.push(`--target=${TARGETS_MAP[opts.target]}`);
			bunArgs.push(entryPoint, '--outfile', outFile);
			const result = spawnSync('bun', bunArgs, { stdio: 'inherit' });
			if (result.status !== 0) throw new Error(`bun build exited with code ${result.status}`);

			const stats = await stat(outFile);
			const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
			builder.log.success(`Binary compiled: ${outFile} (${sizeMb} MB)`);
		},

		supports: {
			read: () => true
		}
	};
}
