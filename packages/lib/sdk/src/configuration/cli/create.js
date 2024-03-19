import { createEvidenceConfig } from '../createEvidenceConfig.js';

/** @type {import("@brianmd/citty").CommandDef} */
export const createConfig = {
	meta: {
		name: 'create',
		description: 'Bootstraps an evidence configuration file'
	},
	args: {
		update: {
			type: 'boolean',
			description: 'Add any missing fields to the evidence configuration file',
			default: false
		}
	},
	async run({ args }) {
		const configPath = await createEvidenceConfig(Boolean(args.update));
		console.log(`Configuration file written to ${configPath}`);
	}
};
