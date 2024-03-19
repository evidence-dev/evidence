import * as prompt from '@clack/prompts';
import { installPluginPrompt } from './install.prompt.js';

/** @type {import("@brianmd/citty").CommandDef} */
export const install = {
	meta: {
		name: 'Install',
		description: 'Utility to install or remove Evidence plugins'
	},
	async run() {
		prompt.intro('Install or Remove Evidence Plugins');

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (!(await installPluginPrompt())) return;

			const again = await prompt.confirm({
				message: 'Would you like to install another plugin?',
				initialValue: false
			});
			if (!again || prompt.isCancel(again)) break;
		}

		prompt.outro('Done!');
	}
};
