import { mergeConfig } from 'vite';

/** @type { import('@storybook/sveltekit').StorybookConfig } */
const config = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook'
	],
	core: {
		builder: '@storybook/builder-vite'
	},
	async viteFinal(config) {
		return mergeConfig(config, {
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
