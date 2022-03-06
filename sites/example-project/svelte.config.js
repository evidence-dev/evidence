import {config} from '@evidence-dev/evidence'
import adapter from '@sveltejs/adapter-static';
import evidencePreprocess from '@evidence-dev/preprocess'

/** @type {import('@sveltejs/kit').Config} */
let sconfig = config;
let newKit = {
		adapter: adapter(),
		package: {
			dir: '../../packages/components',
			emitTypes: true
		}
};

sconfig.kit = {...sconfig.kit, ...newKit}

// Modify preprocess to allow for loading of $lib instead of package version of components library
sconfig.preprocess = evidencePreprocess(true)

export default sconfig;