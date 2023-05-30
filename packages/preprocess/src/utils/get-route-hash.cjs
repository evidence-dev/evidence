const md5 = require('blueimp-md5');

module.exports = {
	/**
	 * Generates a unique (but consistent) hash for a route
	 * @param {string} filename
	 * @example /src/pages/+page.md /src/pages/my-route/+page.md
	 * @returns string
	 */
	getRouteHash: (filename) => {
		const isIndex = filename.split('/src/pages')[1] === '/+page.md';
		if (isIndex) return md5('/');

		let route = filename
			.split('/src/pages')?.[1]
			.replace('.md', '')
			.replace(/\/\+page/g, '');
		if (!route) {
			throw new Error(
				`Failed to generate route hash for ${filename} (${JSON.stringify({ isIndex })})`
			);
		}
		return md5(route);
	}
};
