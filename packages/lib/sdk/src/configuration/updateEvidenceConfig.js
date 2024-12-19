import { findFile } from 'pkg-types';
import yaml from 'yaml';
import fs from 'fs/promises';
import path from 'path';

/**
 * @param {import("zod").infer<typeof import("./schemas/config.schema.js").EvidenceConfigSchema>} cfg
 * @returns {Promise<string>}
 */
export const updateEvidenceConfig = async (cfg) => {
	const configPath = await findFile('evidence.config.yaml').catch(() =>
		path.join(process.cwd(), 'evidence.config.yaml')
	);

	const content = yaml.stringify(cfg);
	await fs.writeFile(configPath, content);

	return configPath;
};
