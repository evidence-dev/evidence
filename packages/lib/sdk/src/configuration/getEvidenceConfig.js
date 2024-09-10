import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { EvidenceConfigSchema } from './schemas/config.schema.js';
import { EvidenceError } from '../lib/EvidenceError.js';
import { getEvidenceConfigLegacy } from './getEvidenceConfig.legacy.js';
import { projectRoot } from '../lib/projectPaths.js';

/**
 * @returns {import("zod").infer<typeof EvidenceConfigSchema>}
 */
export const getEvidenceConfig = () => {
	try {
		const configFilePath = path.join(projectRoot, 'evidence.config.yaml');
		const configFileContent = fs.readFileSync(configFilePath, 'utf-8');

		const result = yaml.parse(configFileContent.replaceAll(/($|\s)(@.+):/g, '$1"$2":'));
		return EvidenceConfigSchema.parse(result);
	} catch (e) {
		if (e instanceof Error && e.message.startsWith('Cannot find matching evidence.config.yaml')) {
			return getEvidenceConfigLegacy();
		}
		throw new EvidenceError('Unknown Error while loading Evidence Configuration', [], { cause: e });
	}
};
