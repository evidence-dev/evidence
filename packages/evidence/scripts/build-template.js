// Populate the template that's shipped with the package using a subset of files from the example-project
import path from 'path';
import fsExtra from 'fs-extra';
import fs from 'fs';
const templatePaths = [
	'package.json',
	'static/',
	'sources/',
	'src/app.css',
	'src/app.html',
	'src/hooks.client.js',
	'src/hooks.server.js',
	'src/global.d.ts',
	'src/pages/+page.md',
	'src/pages/+layout.svelte',
	'src/pages/extractQueries.server.js',
	'src/pages/+layout.server.js',
	'src/pages/+layout.js',
	'src/pages/+error.svelte',
	'src/pages/settings/',
	'src/pages/explore',
	'src/pages/api/',
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

const svelteConfigFile = new URL('svelte.config.js', import.meta.url);
const viteConfigFile = new URL('vite.config.js', import.meta.url);
// Create a clean SK config (workspace's is modified)
fs.writeFileSync('./template/svelte.config.js', fs.readFileSync(svelteConfigFile));

fsExtra.outputFileSync('./template/vite.config.js', fs.readFileSync(viteConfigFile));

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
