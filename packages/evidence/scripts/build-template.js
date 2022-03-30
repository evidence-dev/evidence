// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fs from 'fs-extra'

const templatePaths = [
    '.npmrc',
    'license',
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
import {config} from '@evidence-dev/evidence'
export default config
    `
)

// Create a readme 
fs.outputFileSync('./template/README.md',
`
# Evidence Template Project

Thank you for checking out Evidence. 

## Learning More

- [Getting Started Walkthrough](https://docs.evidence.dev/getting-started/get-started)
- [Project Home Page](https://www.evidence.dev)
- [Github](https://github.com/evidence-dev/evidence)

`
)