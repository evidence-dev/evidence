import '../src/app.postcss';
import WithUSQL from '../src/lib/storybook-helpers/WithUSQL.svelte';
import { initialize } from '../src/lib/storybook-helpers/initializeUSQL.js';

/** @type { import('@storybook/svelte').Preview } */
const preview = {
	parameters: {
		actions: { argTypesRegex: '^on[A-Z].*' },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/
			}
		}
	},
	argTypes: {
		data: { table: { disable: true } },
		evidenceInclude: { table: { disable: true } },
		series: { table: { disable: true } }
	},
	decorators: [() => WithUSQL],
	loaders: [
		async () => ({
			usqlLoaded: await initialize()
		})
	]
};

export default preview;
