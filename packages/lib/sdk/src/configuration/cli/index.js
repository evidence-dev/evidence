import { createConfig } from './create.js';
import { migrateConfig } from './migrate.js';

/** @type {import("@brianmd/citty").CommandDef} */
export const config = {
	meta: {
		name: 'config',
		description: 'Configure Evidence, add or remove component plugins and datasources'
	},
	subCommands: {
		create: createConfig,
		migrate: migrateConfig
	}
};
