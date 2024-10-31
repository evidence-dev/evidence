import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import yaml from 'yaml';
import { EvidenceConfigSchema } from './schemas/config.schema.js';
import { EvidenceError } from '../lib/EvidenceError.js';
import { getEvidenceConfigLegacy } from './getEvidenceConfig.legacy.js';
import { projectRoot } from '../lib/projectPaths.js';
import z from 'zod';
import { unnestZodError } from '../lib/unnest-zod-error.js';

/** @typedef {import("zod").AnyZodObject} AnyZodObject */

/**
 * @template {AnyZodObject} [Schema=EvidenceConfigSchema]
 * @param {Schema} [schema]
 * @returns {import("zod").infer<Schema>}
 */
export const getEvidenceConfig = (
	// The typecasting here is necessary because Typescript
	// https://stackoverflow.com/a/59363875/9080819
	// Technically, this function could be misused by passing a template type
	// that doesn't match the default parameter, but that shouldn't happen
	// with normal usage (especially since we're using JS, not TS directly)
	schema = /** @type {Schema} */ (/** @type {unknown} */ (EvidenceConfigSchema))
) => {
	try {
		const configFilePath = path.join(projectRoot, 'evidence.config.yaml');
		const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
		const result = yaml.parse(configFileContent.replaceAll(/($|\s)(@.+):/g, '$1"$2":'));
		return schema.parse(result);
	} catch (e) {
		if (
			e instanceof Error &&
			(e.message.startsWith('Cannot find matching evidence.config.yaml') ||
				e.message.includes('no such file or directory'))
		) {
			return getEvidenceConfigLegacy();
		}

		if (e instanceof z.ZodError) {
			const errors = Object.entries(unnestZodError(e))
				.map(([path, error]) => `  ${chalk.gray(path)}: ${chalk.redBright(error)}`)
				.join('\n');
			console.error(`${chalk.red(`Invalid evidence.config.yaml file:`)}\n${errors}`);
		}

		console.log(e);
		throw new EvidenceError('Unknown Error while loading Evidence Configuration', [], { cause: e });
	}
};
