// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fs from 'fs-extra';

const templatePaths = [
	'.npmrc',
	'static/',
	'sources/',
	'src/app.css',
	'src/app.html',
	'src/global.d.ts',
	'src/pages/+page.md',
	'src/pages/+layout.svelte',
	'src/pages/+layout.server.js',
	'src/pages/+layout.js',
	'src/pages/settings/',
	'src/pages/explore',
	'src/pages/api/',
	'tailwind.config.cjs',
	'postcss.config.cjs'
];

fs.emptyDirSync('./template/');

templatePaths.forEach((p) => {
	fs.copySync(path.join('../../sites/example-project', p), path.join('./template', p));
});

fs.emptyDirSync('./template/sources');

// Create a clean SK config (workspace's is modified)
fs.outputFileSync(
	'./template/svelte.config.js',
	`
    import evidencePreprocess from '@evidence-dev/preprocess'
    import preprocess from "svelte-preprocess";
    import adapter from '@sveltejs/adapter-static';
    import { evidencePlugins } from '@evidence-dev/plugin-connector';
    
    /** @type {import('@sveltejs/kit').Config} */
    
    const config = {
        extensions: ['.svelte', ".md"], 
        preprocess: [
            ...evidencePreprocess(true),
            evidencePlugins(),
            preprocess({
              postcss: true,
            }),
        ],
        kit: {
            adapter: adapter({
                strict: false
            }),
            files: {
                routes: 'src/pages',
                lib: 'src/components'
            }
        }
    };
    
    export default config    
    `
);

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
