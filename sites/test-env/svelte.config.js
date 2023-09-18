/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: [],
	extensions: [],
	kit: {
		files: {}
	},
	vite: {
		server: {
			watch: {
				usePolling: true
			}
		}
	}
};
