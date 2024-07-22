import { findFile } from 'pkg-types';
import { EvidenceError } from '../lib/EvidenceError.js';
import { EvidenceConfigSchema } from './schemas/config.schema.js';
import fs from 'fs/promises';
import yaml from 'yaml';

export const getEvidenceConfigLegacy = async () => {
	const legacyFile = await fs
		.readFile(await findFile('evidence.plugins.yaml', { reverse: true }), 'utf-8')
		.catch(() => {
			throw new EvidenceError('Could not find an evidence.plugins.yaml file.');
		});
	const result = yaml.parse(legacyFile.replaceAll(/($|\s)(@.+):/g, '$1"$2":'));

	const { success, data } = EvidenceConfigSchema.safeParse({ plugins: result });

	if (!success) throw new EvidenceError('Invalid evidence.plugins.yaml file detected');
	return data;
};
