module.exports = {
	root: true,
	extends: ['eslint:recommended', 'prettier', 'plugin:svelte/recommended'],
	overrides: [{ files: ['*.spec.js', '*.spec.cjs'], env: { jest: true } }],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 13
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	}
};
