import { createConfig } from './create.js';

/** @type {import("@brianmd/citty").CommandDef} */
export const config = {
	meta: {
		name: 'config',
		description: 'Configure Evidence, add or remove component plugins and datasources'
	},
	subCommands: {
		create: createConfig
	}
};
