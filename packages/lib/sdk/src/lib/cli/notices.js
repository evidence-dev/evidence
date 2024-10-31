import { getEvidenceConfig } from '../../configuration/getEvidenceConfig.js';
import { cmdFail } from './cmdFail.js';
import chalk from 'chalk';

/**
 * @param {string} cmdName
 * @returns {import("@brianmd/citty").CommandDef}
 */
export const deprecationNotice = (cmdName) => ({
	meta: { name: cmdName },
	run: () => {
		throw new Error(`${cmdName} has been deprecated`);
	}
});

/**
 * @param {string} cmdName
 * @param {import("@brianmd/citty").CommandDef} cmd
 * @param {boolean} [requiresLayout = false]
 * @returns {import("@brianmd/citty").CommandDef}
 */
export const evidenceProjectOnlyNotice = (cmdName, cmd, requiresLayout) => {
	return {
		...cmd,
		run(...args) {
			/** @type {boolean} */
			let isEvidenceProject = false;

			const config = getEvidenceConfig();
			if (config) isEvidenceProject = true;
			if (config && requiresLayout && !config.layout) isEvidenceProject = false;

			if (isEvidenceProject) return cmd.run?.(...args);
			else
				cmdFail(
					`${chalk.bold(`\`evidence ${cmdName}\``)} is only available in Evidence projects.`,
					[
						'If this is meant to be an Evidence project',
						`please create an evidence.config.yaml with ${chalk.bold(`\`evidence config create\``)}`
					]
				);
		}
	};
};
