import path from 'node:path';
import fs from 'node:fs';
import yaml from 'yaml';
import { EvidenceError } from '../lib/EvidenceError.js';
import { EvidenceConfigSchema } from './schemas/config.schema.js';
import { projectRoot } from '../lib/projectPaths.js';

export const getEvidenceConfigLegacy = () => {
	let fileContents;
	try {
		const filepath = path.join(projectRoot, 'evidence.plugins.yaml');
		fileContents = fs.readFileSync(filepath, 'utf-8');
	} catch (e) {
		// Do nothing if `evidence.plugins.yaml` isnt found. `evidence.plugins.yaml` is deprecated and `evidence.config.yaml` should be used instead.
		return;
	}

	const result = yaml.parse(fileContents.replaceAll(/($|\s)(@.+):/g, '$1"$2":'));

	const { success, data, error } = EvidenceConfigSchema.safeParse({ plugins: result });
	if (!success) throw new EvidenceError(`Invalid evidence.plugins.yaml file detected: ${error}`);
	return data;
};
