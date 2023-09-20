// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fsExtra from 'fs-extra';
import fs from 'fs';
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

fsExtra.emptyDirSync('./template/');

templatePaths.forEach((p) => {
	fsExtra.copySync(path.join('../../sites/example-project', p), path.join('./template', p));
});

fsExtra.emptyDirSync('./template/sources');

const configFileLocation = new URL(path.join(path.parse(import.meta.url).dir, 'svelte.config.js')).pathname;

// Create a clean SK config (workspace's is modified)
fs.writeFileSync('./template/svelte.config.js', fs.readFileSync(configFileLocation));

fsExtra.outputFileSync(
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
