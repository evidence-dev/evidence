import { mergeConfig } from 'vite';
import { evidenceThemes } from '@evidence-dev/tailwind/vite-plugin';

/** @type { import('@storybook/sveltekit').StorybookConfig } */
const config = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-themes',
		'@storybook/addon-interactions',
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook'
	],
	core: {
		builder: '@storybook/builder-vite'
	},
	async viteFinal(config) {
		// This was being weird about the imports, so we did it dynamically
		const tailwindcss = (await import('@tailwindcss/vite')).default;
		return mergeConfig(config, {
			plugins: [tailwindcss(), evidenceThemes()],
			server: {
				fs: {
					strict: false
				}
			}
		});
	},
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	staticDirs: ['../static']
};
export default config;
