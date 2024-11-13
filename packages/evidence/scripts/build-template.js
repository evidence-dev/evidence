// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fsExtra from 'fs-extra';
import fs from 'fs';
const templatePaths = [
	'static/',
	'sources/',
	'src/app.css',
	'src/app.html',
	'src/hooks.client.js',
	'src/hooks.server.js',
	'src/global.d.ts',
	'src/pages/fix-tprotocol-service-worker.js/+server.js',
	'src/fix-tprotocol-service-worker.js',
	'src/pages/+page.md',
	'src/pages/+layout.svelte',
	'src/pages/+layout.js',
	'src/pages/+error.svelte',
	'src/pages/settings/',
	'src/pages/explore',
	'src/pages/api/',
	'src/pages/manifest.webmanifest/+server.js',
	'tailwind.config.cjs',
	'postcss.config.cjs'
];
const ignorePaths = ['static/data'];

fsExtra.emptyDirSync('./template/');

templatePaths.forEach((p) => {
	fsExtra.copySync(path.join('../../sites/example-project', p), path.join('./template', p));
});

ignorePaths.forEach((p) => {
	fs.rmSync(path.join('./template', p), {
		force: true,
		recursive: true
	});
});

fsExtra.emptyDirSync('./template/sources');

const configFileLocation = new URL('svelte.config.js', import.meta.url);
// Create a clean SK config (workspace's is modified)
fs.writeFileSync('./template/svelte.config.js', fs.readFileSync(configFileLocation));

fsExtra.outputFileSync(
	'./template/vite.config.js',
	`import { sveltekit } from "@sveltejs/kit/vite"
	import { evidenceVitePlugin } from "@evidence-dev/plugin-connector"
	import { createLogger } from 'vite';
	import { sourceQueryHmr, configVirtual } from '@evidence-dev/sdk/build/vite';
	import { isDebug } from '@evidence-dev/sdk/utils';
	import preprocess from '@evidence-dev/preprocess';
	import { log } from "@evidence-dev/sdk/logger";

	const logger = createLogger();
	logger.error = (msg) => log.error(msg);
	logger.warn = (msg) => log.debug(msg);
	logger.info = (msg) => log.debug(msg);
	logger.warnOnce = (msg) => log.debug(msg);

    const strictFs = (process.env.NODE_ENV === 'development') ? false : true;
    /** @type {import('vite').UserConfig} */
     const config = 
    {
        plugins: [sveltekit(), configVirtual(), evidenceVitePlugin(), sourceQueryHmr()],
        optimizeDeps: {
            include: ['echarts-stat', 'echarts', 'blueimp-md5', 'nanoid', '@uwdata/mosaic-sql',
				// We need these to prevent HMR from doing a full page reload
				...(process.env.EVIDENCE_DISABLE_INCLUDE ? [] : [
					'@evidence-dev/core-components',
					...preprocess.injectedEvidenceImports.map(i => i.from),
					'debounce', 
					'@duckdb/duckdb-wasm',
					'apache-arrow'
				])
				
			],
            exclude: ['svelte-icons', '@evidence-dev/universal-sql', '$evidence/config']
        },
        ssr: {
            external: ['@evidence-dev/telemetry', 'blueimp-md5', 'nanoid', '@uwdata/mosaic-sql', '@evidence-dev/plugin-connector']
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
			// 🚩 Triple check this
			minify: isDebug() ? false : true,
			target: isDebug() ? 'esnext' : undefined,
			rollupOptions: {
				external: [/^@evidence-dev\\/tailwind\\/fonts\\//],
				onwarn(warning, warn) {
					if (warning.code === 'EVAL') return;
					warn(warning);
				}
			}
		},
		customLogger: logger,
		logLevel: 'silent'
    }
    export default config`
);

// Create a readme
fsExtra.outputFileSync(
	'./template/README.md',
	`
# Evidence Template Project

Thank you for checking out Evidence. 

## Learning More

- [Docs](https://docs.evidence.dev/)
- [Project Home Page](https://www.evidence.dev)
- [Github](https://github.com/evidence-dev/evidence)

`
);
