import { findFile } from 'pkg-types';
import yaml from 'yaml';
import fs from 'fs/promises';
import { EvidenceConfigSchema } from './schemas/config.schema.js';
import { EvidenceError } from '../lib/EvidenceError.js';
import { getEvidenceConfigLegacy } from './getEvidenceConfig.legacy.js';

/**
 * @returns {Promise<import("zod").infer<typeof EvidenceConfigSchema>>}
 */
export const getEvidenceConfig = async () => {
	try {
		const configFileContent = await fs.readFile(
			await findFile('evidence.config.yaml', { reverse: true }),
			'utf-8'
		);

		const result = yaml.parse(configFileContent.replaceAll(/($|\s)(@.+):/g, '$1"$2":'));
		return EvidenceConfigSchema.parse(result);
	} catch (e) {
		if (e instanceof Error && e.message.startsWith('Cannot find matching evidence.config.yaml')) {
			return await getEvidenceConfigLegacy();
			// throw new EvidenceError(
			// 	'Could not find an evidence.config.yaml file, if this is an Evidence project, please create that file'
			// );
		}
		throw new EvidenceError('Unknown Error while loading Evidence Configuration', [], { cause: e });
	}
};
