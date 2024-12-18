import fs from 'fs/promises';
import path from 'path';
import { getEvidenceConfig } from './getEvidenceConfig.js';
import { updateEvidenceConfig } from './updateEvidenceConfig.js';
import { log } from '../logger/index.js';
import { projectRoot } from '../lib/projectPaths.js';
import { getEvidenceConfigLegacy } from './getEvidenceConfig.legacy.js';
import merge from 'lodash.merge';
import { EvidenceConfigSchema } from './schemas/config.schema.js';

/** @returns {Promise<boolean>} */
export const migratePluginFileToConfigFile = async () => {
	const pluginStat = await fs
		.stat(path.join(projectRoot, 'evidence.plugins.yaml'))
		.then(() => true)
		.catch(() => false);
	if (!pluginStat) {
		log.warn('No evidence.plugins.yaml file found in project directory, no action was taken.');
		return false;
	}

	/** @type {import("./schemas/config.schema.js").EvidenceConfig} */
	const config = getEvidenceConfig()
	await updateEvidenceConfig(config);

	// if evidence.plugins.yaml exists in the project directory, delete it
	try {
		await fs.unlink(path.join(process.cwd(), 'evidence.plugins.yaml'));
	} catch (e) {
		// do nothing
		log.debug('Error Encountered Deleteing evidence.plugins.yaml', [e]);
	}
	return true;
};
