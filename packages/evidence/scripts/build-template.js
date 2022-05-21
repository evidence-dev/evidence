// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fs from 'fs-extra'

const templatePaths = [
    '.npmrc',
    'static/',
    'src/app.css',
    'src/app.html',
    'src/global.d.ts',
    'src/pages/index.md',
    'src/pages/__layout.svelte',
    'src/pages/settings/',
    'src/pages/api/'
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
    import FullReload from 'vite-plugin-full-reload'
    
    /** @type {import('@sveltejs/kit').Config} */
    
    const config = {
        extensions: ['.svelte', ".md"],
        preprocess: evidencePreprocess(),
        kit: {
            adapter: adapter(),
            files: {
                routes: 'src/pages',
                lib: 'src/components'
            },
            vite: {
                optimizeDeps: {
                    include: ['echarts-stat', 'export-to-csv', 'downloadjs'],
                    exclude: ['@evidence-dev/components']
                },
                ssr: {
                    external: ['@evidence-dev/db-orchestrator', 'git-remote-origin-url']
                },
                plugins: [
                    FullReload.default(['./.evidence-queries/extracted/**'], {delay: 150}),
                ]
            }
        }
    };
    
    export default config    
    `
)

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