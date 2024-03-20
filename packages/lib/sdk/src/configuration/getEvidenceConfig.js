import { findFile } from 'pkg-types';
import yaml from 'yaml';
import fs from 'fs/promises';
import { EvidenceConfigSchema } from './schemas/config.schema.js';

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
			throw new Error(
				'Could not find an evidence.config.yaml file, if this is an Evidence project, please create that file'
			);
		}
		throw e;
	}
};
