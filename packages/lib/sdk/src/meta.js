export * as paths from './lib/projectPaths.js';
let isExampleProject = false;

if (process.cwd().endsWith('sites/example-project')) {
	isExampleProject = true;
}

export { isExampleProject };
