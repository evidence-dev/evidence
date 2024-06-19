import '../src/app.postcss';
import WithEvidence from '../src/lib/storybook-helpers/WithEvidence.svelte';
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
		},
		chromatic: {
			diffThreshold: 0.1
		}
	},
	argTypes: {
		data: { table: { disable: true } },
		evidenceInclude: { table: { disable: true } },
		series: { table: { disable: true } }
	},
	decorators: [() => WithEvidence],
	loaders: [
		async () => ({
			usqlLoaded: await initialize()
		})
	]
};

export default preview;
