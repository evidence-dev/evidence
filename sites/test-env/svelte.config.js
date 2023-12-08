/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: [],
	kit: {},
	vite: {
		server: {
			watch: {
				usePolling: true
			}
		}
	}
};
