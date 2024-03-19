import * as prompt from '@clack/prompts';
import { editConnectionsPrompt } from './edit.prompt.js';

/** @type { import("@brianmd/citty").CommandDef } */
export const edit = {
	meta: {
		name: 'edit',
		description: 'Add, remove, and update connections'
	},

	async run() {
		prompt.intro('Update Datasource Connections');

		await editConnectionsPrompt();

		prompt.outro('Done!');

		return true;
	}
};
