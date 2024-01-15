/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: [],
	compilerOptions: {
		dev: true
	},
	kit: {},
	vite: {
		server: {
			watch: {
				usePolling: true
			}
		}
	}
};
