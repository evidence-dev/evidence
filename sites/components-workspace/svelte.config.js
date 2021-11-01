import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		package: {
			dir: '../../packages/components',
			emitTypes: true
		}
	}
};

export default config;
