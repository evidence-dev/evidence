import { log } from '../../logger/index.js';
import { migratePluginsToConfig } from '../migratePluginsToConfig.js';

/** @type {import("@brianmd/citty").CommandDef} */
export const migrateConfig = {
	meta: {
		name: 'migrate',
		description: 'Migrates an existing evidence.plugins.yaml file to evidence.config.yaml'
	},
	async run() {
		if (await migratePluginsToConfig()) log.info('Migrated evidence.plugins.yaml to evidence.config.yaml');
	}
};
