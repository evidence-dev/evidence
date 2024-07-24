import * as path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { applySidecarConfig, getSidecarApp } from './sidecar-app.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { getManifest } from './virtuals/node/static-assets.js';
import { copyToLayout } from './layout-plugins/copy-to-layout.js';
import { dataDirectory, evidenceDirectory } from './../../lib/projectPaths.js';
/** @type {Record<string, () => string>} */
import * as dynamicVirtuals from './virtuals-dynamic.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PREFIX = `$evidence/`;

/**
 * @type {() => Promise<import("vite").Plugin>}
 */
export const evidencePlugin = async () => {
	const sidecar = getSidecarApp();

	// TODO: Find a way to make this get a list of queries that should be available on the page
	return {
		name: 'evidence',

		buildStart: async function () {
			if (this.meta.watchMode) {
				await copyToLayout();
			} else {
				this.emitFile({
					type: 'asset',
					name: path.join('_evidence', 'manifest.json'),
					source: getManifest(),
					fileName: path.join('_evidence', 'manifest.json'),
					needsCodeReference: false
				});
				const dataDirExists = await fs
					.stat(dataDirectory)
					.then((r) => r.isDirectory())
					.catch(() => false);
				if (!dataDirExists) {
					console.warn(
						chalk.yellow(
							'Evidence data directory not found, if you use source queries in this project, you probably need to run sources'
						)
					);
					return;
				}

				const queries = await fs.readdir(dataDirectory, { recursive: true, withFileTypes: true });

				for (const query of queries) {
					if (query.isFile() && query.name.endsWith('.parquet')) {
						const relPath = path.join(path.relative(dataDirectory, query.path), query.name);

						this.emitFile({
							type: 'asset',
							name: path.join('_evidence', relPath),
							source: await fs.readFile(path.join(query.path, query.name)),
							fileName: path.join('_evidence', relPath),
							needsCodeReference: false
						});
					}
				}
			}
		},

		async configureServer(vite) {
			vite.middlewares.use(sidecar);
		},

		async configurePreviewServer(vite) {
			vite.middlewares.use(sidecar);
		},

		async config(cfg) {
			if (!cfg.optimizeDeps) cfg.optimizeDeps = {};
			if (!cfg.optimizeDeps.exclude) cfg.optimizeDeps.exclude = [];
			if (!cfg.optimizeDeps.exclude.includes('@evidence-dev/universal-sql/client-duckdb'))
				cfg.optimizeDeps.exclude.push('@evidence-dev/universal-sql/client-duckdb');

			if (!cfg.optimizeDeps.include) cfg.optimizeDeps.include = [];
			// TODO: This has something to do with the import management crap
			// if (!cfg.ssr) cfg.ssr = {}
			// if (!cfg.ssr.noExternal) cfg.ssr.noExternal = []
			// if (typeof cfg.ssr.noExternal !== "boolean" && !Array.isArray(cfg.ssr.noExternal)) cfg.ssr.noExternal = [cfg.ssr.noExternal]
			// if (typeof cfg.ssr.noExternal !== "boolean") {
			// 	cfg.ssr.noExternal.push(/@evidence-dev\/.+/)
			// 	cfg.ssr.noExternal.push(/@steeze-ui\/.+/)
			// }

			if (!cfg.server) cfg.server = {};
			if (!cfg.server.fs) cfg.server.fs = {};
			if (!cfg.server.fs.allow) cfg.server.fs.allow = [];

			cfg.server.fs.allow.push(evidenceDirectory);

			// // Lifted from SvelteKit
			// const allow = new Set([
			// 	path.resolve('src'), // TODO this isn't correct if user changed all his files to sth else than src (like in test/options)
			// 	path.resolve('node_modules'),
			// 	// path.resolve(vite.searchForWorkspaceRoot(cwd), 'node_modules')
			// ]);

			for (const allowDir of ['.', 'node_modules', '../node_modules', '../../node_modules']) {
				if (!cfg.server.fs.allow.includes(allowDir)) cfg.server.fs.allow.push(allowDir);
			}

			// This lets us serve from node_modules regardless of where it is linked.
			// Vite considers the "real" path, not the link path when serving.

			/** @type {string} */
			let resolvingPath = path.resolve('node_modules');
			// eslint-disable-next-line no-constant-condition
			while (true) {
				/** @type {string | false} */
				const nextPath = await fs
					.readlink(resolvingPath)
					.catch(() => fs.readlink(path.resolve(resolvingPath, '..')))
					.catch(() => false);
				if (!nextPath) {
					// /home/brian/code/evidence/sdk/examples/example-layout-plugin/node_modules/@sveltejs/kit/src/runtime/client/entry.js
					// /home/brian/code/evidence/sdk/test-project/examples/example-layout-plugin
					cfg.server.fs.allow.push(resolvingPath);
					break;
				} else {
					if (nextPath.startsWith('.')) resolvingPath = path.relative(resolvingPath, nextPath);
					else resolvingPath = nextPath;
				}
			}

			cfg = applySidecarConfig(cfg);

			return cfg;
		},

		resolveId(id) {
			if (id.startsWith(PREFIX)) {
				return id;
			}

			return null;
		},

		async load(id, opts) {
			if (id.startsWith(PREFIX)) {
				const virtuals = await fs.readdir(path.join(__dirname, 'virtuals'), { recursive: true });
				const idNoPrefix = id.slice(PREFIX.length);
				const idNoExtension = idNoPrefix.split('.').at(0);
				if (!idNoExtension) return null;

				if (idNoExtension in dynamicVirtuals) {
					const dynFunction = /** @type {() => string | Promise<string>} */ (
						// @ts-expect-error
						dynamicVirtuals[idNoExtension]
					);
					return await dynFunction();
				}

				const matches = virtuals.filter((filepath) => {
					if (filepath.endsWith('.d.ts')) return false;
					if (filepath.split('.').at(-2) === 'spec') return false;
					if (!filepath.split('/').at(-1)?.split('.').includes(idNoExtension)) return false;
					return true;
				});

				let targetFile;

				if (matches.length === 1) {
					// Only one possible match
					targetFile = matches[0];
				} else if (matches.length > 1) {
					// There are choices to be made here
					const environmentOptions = matches.filter((m) =>
						m.startsWith(opts?.ssr ? 'node/' : 'browser/')
					);

					if (environmentOptions.length >= 1) {
						if (environmentOptions.length > 1) {
							console.warn(
								chalk.yellow(
									`[!] Multiple Import Files found for $evidence/${idNoPrefix}, this is ambigious and should be corrected. ${environmentOptions.join(
										', '
									)}`
								)
							);
						}
						targetFile = environmentOptions[0];
					} else {
						// There are no specifics
						console.warn(
							chalk.yellow(
								`[!] Multiple Import Files found for $evidence/${idNoPrefix}, this is ambigious and should be corrected. ${matches.join(
									', '
								)}`
							)
						);
						targetFile = matches[0];
					}
				} else {
					console.warn(chalk.yellow(`[!] No Import Files found for $evidence/${idNoPrefix}`));
					return null;
				}

				this.addWatchFile(path.join(__dirname, 'virtuals', targetFile));
				return await fs.readFile(path.join(__dirname, 'virtuals', targetFile), 'utf-8');
			}

			return null;
		}
	};
};
