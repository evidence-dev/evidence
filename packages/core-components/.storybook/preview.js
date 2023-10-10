import '../src/app.postcss';

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
	}
};

export default preview;
