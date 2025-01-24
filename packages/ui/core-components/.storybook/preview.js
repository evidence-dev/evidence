import { withThemeByDataAttribute } from '@storybook/addon-themes';

import '../src/app.postcss';
import WithEvidence from '../src/lib/storybook-helpers/WithEvidence.svelte';
import { initialize } from '../src/lib/storybook-helpers/initializeUSQL.js';

/** @type { import('@storybook/svelte').Preview } */
const preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/
			}
		},
		chromatic: {
			delay: 3000
		}
	},
	argTypes: {
		data: { table: { disable: true } },
		evidenceInclude: { table: { disable: true } },
		series: { table: { disable: true } }
	},
	decorators: [
		withThemeByDataAttribute({
			themes: {
				light: 'light',
				dark: 'dark'
			},
			attributeName: 'data-theme',
			defaultTheme: 'light'
		}),
		() => WithEvidence
	],
	loaders: [
		async () => ({
			usqlLoaded: await initialize()
		})
	]
};

export default preview;
