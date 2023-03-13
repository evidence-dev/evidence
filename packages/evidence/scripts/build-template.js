// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fs from 'fs-extra'

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
    'src/pages/settings/',
    'src/pages/api/',
    'src/components/'
]

fs.emptyDirSync("./template/")

templatePaths.forEach(p => {
    fs.copySync(path.join("../../sites/example-project", p), path.join("./template", p))
})

// Create a clean SK config (workspace's is modified)
fs.outputFileSync('./template/svelte.config.js', 
    `
    import evidencePreprocess from '@evidence-dev/preprocess'
    import adapter from '@sveltejs/adapter-static';
    
    /** @type {import('@sveltejs/kit').Config} */
    
    const config = {
        extensions: ['.svelte', ".md"],
        preprocess: evidencePreprocess(),
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
)

fs.outputFileSync('./template/vite.config.js', 
    `
    import { sveltekit } from "@sveltejs/kit/vite"

    /** @type {import('vite').UserConfig} */
    const config = {
        plugins: [sveltekit()],
        optimizeDeps: {
            include: ['echarts-stat'],
            exclude: ['@evidence-dev/components']
        },
        ssr: {
            external: ['@evidence-dev/db-orchestrator', '@evidence-dev/telemetry', 'blueimp-md5']
        }
    }

    export default config
    `)

// Create a readme 
fs.outputFileSync('./template/README.md',
`
# Evidence Template Project

Thank you for checking out Evidence. 

## Learning More

- [Docs](https://docs.evidence.dev/)
- [Project Home Page](https://www.evidence.dev)
- [Github](https://github.com/evidence-dev/evidence)

`
)