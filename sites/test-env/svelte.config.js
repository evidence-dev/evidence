import adapter from '@sveltejs/adapter-node';

/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: [],
	compilerOptions: {
		dev: true
	},
	kit: { adapter: adapter() },
	vite: {
		server: {
			watch: {
				usePolling: true
			}
		}
	}
};
