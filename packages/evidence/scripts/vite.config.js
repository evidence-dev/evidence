import { sveltekit } from '@sveltejs/kit/vite';
import { evidenceVitePlugin } from '@evidence-dev/plugin-connector';
import { createLogger } from 'vite';
import fs from 'fs';
import path from 'path';
const logger = createLogger();
const loggerWarn = logger.warn;

logger.warn = (msg, options) => {
	// ignore fs/promises warning, used in +layout.js behind if (!browser) check
	if (msg.includes('Module "fs/promises" has been externalized for browser compatibility')) return;
	// ignore eval warning, used in duckdb-wasm
	if (
		msg.includes('Use of eval in') &&
		msg.includes(
			'is strongly discouraged as it poses security risks and may cause issues with minification.'
		)
	)
		return;
	loggerWarn(msg, options);
};

/**
 * @param {Object} a
 * @param {Object} b
 * @returns {Object}
 */
const deepMerge = (a, b) => {
	for (const key in b) {
		if (typeof b[key] === 'object' && !Array.isArray(b[key])) {
			if (!a[key]) a[key] = {};
			deepMerge(a[key], b[key]);
		} else {
			Object.assign(a, { [key]: b[key] });
		}
	}
	return a;
};

const strictFs = process.env.NODE_ENV === 'development' ? false : true;
/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), evidenceVitePlugin()],
	optimizeDeps: {
		include: [
			'echarts-stat',
			'echarts',
			// We need these to prevent HMR from doing a full page reload
			...(process.env.EVIDENCE_DISABLE_INCLUDE
				? []
				: [
						'@evidence-dev/core-components',
						'@evidence-dev/component-utilities/stores',
						'@evidence-dev/component-utilities/formatting',
						'@evidence-dev/component-utilities/globalContexts',
						'@evidence-dev/component-utilities/buildQuery',
						'@evidence-dev/component-utilities/profile',
						'debounce',
						'@evidence-dev/query-store',
						'@duckdb/duckdb-wasm',
						'apache-arrow'
					])
		],
		exclude: ['svelte-icons', '@evidence-dev/universal-sql']
	},
	ssr: {
		external: [
			'@evidence-dev/db-orchestrator',
			'@evidence-dev/telemetry',
			'blueimp-md5',
			'@evidence-dev/plugin-connector'
		]
	},
	server: {
		fs: {
			strict: strictFs // allow template to get dependencies outside the .evidence folder
		},
		hmr: {
			overlay: false
		}
	},
	build: {
		rollupOptions: {
			external: [/^@evidence-dev\/tailwind\/fonts\//],
			onwarn(warning, warn) {
				if (warning.code === 'EVAL') return;
				warn(warning);
			}
		}
	},
	customLogger: logger
};

async function loadUserConfiguration() {
	if (!process.cwd().includes('.evidence')) return;
	const rootDir = process.cwd().split('.evidence')[0];
	const rootDirContents = fs.readdirSync(rootDir);

	if (!rootDirContents.includes('vite.config.js')) return;

	const configFileLocation = path.join(rootDir, 'vite.config.js');
	const configURL = new URL(`file:///${configFileLocation}`).href;
	/** @type {import("vite").UserConfig} */
	const userConfig = await import(configURL).then((r) => r.default);

	if (userConfig.define) {
		if (!config.define) config.define = {};
		Object.assign(config.define, userConfig.define);
	}

	if (Object.keys(userConfig).filter((f) => f !== 'define').length > 0) {
		console.warn('The only vite config that can be overriden is the define property!');
	}

	console.log('Custom svelte.config.js applied');
}

await loadUserConfiguration();

export default config;
