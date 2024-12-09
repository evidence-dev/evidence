/** @typedef {import('prismjs')} Prism */

export const loadPrismComponents = async () => {
	const Prism = (await import('prismjs')).default;
	await import('prismjs/components/prism-bash');
	await import('prismjs/components/prism-sql');
	await import('prismjs/components/prism-python');
	await import('prismjs/components/prism-markdown');
	await import('prismjs/components/prism-yaml.js');
	await import('./prism-svelte.js');

	return Prism;
};
