import {config} from '@evidence-dev/evidence'
import adapter from '@sveltejs/adapter-static';

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

export default sconfig;