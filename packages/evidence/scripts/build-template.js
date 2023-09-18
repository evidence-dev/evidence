// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fs from 'fs-extra';

const templatePaths = [
	'.npmrc',
	'static/',
	'sources/',
	'src/app.css',
	'src/app.html',
	'src/hooks.client.js',
	'src/hooks.server.js',
	'src/global.d.ts',
	'src/pages/+page.md',
	'src/pages/+layout.svelte',
	'src/pages/+layout.server.js',
	'src/pages/+layout.js',
	'src/pages/+error.svelte',
	'src/pages/settings/',
	'src/pages/api/',
	'tailwind.config.cjs',
	'postcss.config.cjs'
];

fs.emptyDirSync('./template/');

templatePaths.forEach((p) => {
	fs.copySync(path.join('../../sites/example-project', p), path.join('./template', p));
});

fs.emptyDirSync('./template/sources');

const configFileLocation = path
	.join(path.parse(import.meta.url).dir, 'svelte.config.js')
	.split('file:')
	.at(-1);
// Create a clean SK config (workspace's is modified)
fs.copySync(configFileLocation, './template/svelte.config.js');

fs.outputFileSync(
	'./template/vite.config.js',
	`import { sveltekit } from "@sveltejs/kit/vite"
    const strictFs = (process.env.NODE_ENV === 'development') ? false : true;
    /** @type {import('vite').UserConfig} */
     const config = 
    {
        plugins: [sveltekit()],
        optimizeDeps: {
            include: ['echarts-stat', 'echarts'],
            exclude: ['svelte-icons', 'svelte-tiny-linked-charts']
        },
        ssr: {
            external: ['@evidence-dev/db-orchestrator', '@evidence-dev/telemetry', 'blueimp-md5']
        },
        server: {
            fs: {
                strict: strictFs // allow template to get dependencies outside the .evidence folder
            }
        }
    }
    export default config`
);

// Create a readme
fs.outputFileSync(
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
