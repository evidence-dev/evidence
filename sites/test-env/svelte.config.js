import adapter from '@sveltejs/adapter-static';

/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: [],
	compilerOptions: {
		dev: true
	},
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		})
	},
	vite: {
		server: {
			watch: {
				usePolling: true
			}
		}
	}
};
