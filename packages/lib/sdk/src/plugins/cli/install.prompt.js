import * as prompt from '@clack/prompts';
import { getEvidenceConfig } from '../../configuration/getEvidenceConfig.js';
import { getPublishedDatasources } from '../datasources/getPublishedDatasources.js';
import { EvidenceError } from '../../lib/EvidenceError.js';
import chalk from 'chalk';
import { readPackageJSON, resolvePackageJSON, writePackageJSON } from 'pkg-types';
import { updateEvidenceConfig } from '../../configuration/updateEvidenceConfig.js';

/**
 * @param {boolean} [installOnly = false]
 * @param {"datasource"} [installType]
 * @param {boolean} [skipCancel]
 * @returns {Promise<boolean>}
 */
export const installPluginPrompt = async (installOnly, installType, skipCancel) => {
	let action;

	const bail = skipCancel ? prompt.log.error : prompt.cancel;

	if (!installOnly) {
		action = await prompt.select({
			options: [
				{ label: 'Install Plugins', value: 'install' },
				{ label: 'Remove Plugins', value: 'remove' }
			],
			message: 'What would you like to do?'
		});
		if (action === 'remove') throw new EvidenceError('This action is not currently supported');
		if (prompt.isCancel(action)) {
			bail('Cancelled');
			return false;
		}
	} else {
		action = 'install';
	}
	let pluginType;
	if (!installType) {
		pluginType = await prompt.select({
			message: 'What kind of plugin would you like to install?',
			options: [{ label: 'Datasource', value: 'datasource' }]
		});
		if (prompt.isCancel(pluginType)) {
			bail('Cancelled');
			return false;
		}
	} else {
		pluginType = installType;
	}

	switch (pluginType) {
		case 'datasource': {
			const availableLoad = prompt.spinner();

			availableLoad.start('Fetching available sources');
			const [availableSources, evidenceConfig] = await Promise.all([
				getPublishedDatasources(),
				getEvidenceConfig()
			]);
			availableLoad.stop('Done!', 0);

			const maxNameLength = Math.max(...availableSources.map((s) => s.name.length));
			const options = availableSources.map((source) => {
				const installed = source.name in (evidenceConfig.plugins.datasources ?? {});

				let message = '';

				if (installed) message += chalk.green('[Installed] ');
				else message += '            ';

				message += source.name.padEnd(maxNameLength);
				message += chalk.dim(` (${source.version})`);

				message += ` | (${source.evidence.datasources
					.map((s) => (Array.isArray(s) ? s[0] : s))
					.join(', ')})`;

				return {
					label: message,
					value: source
				};
			});

			/** @type {symbol | import("../schemas/plugin-package.schema.js").DatasourcePackage} */
			const selectedSource = await prompt.select({
				message: 'Which source would you like to install?',
				options
			});
			if (prompt.isCancel(selectedSource) || !selectedSource) {
				bail('Cancelled');
				return false;
			}

			if (!selectedSource.name.startsWith('@evidence-dev')) {
				const unsafe = await prompt.confirm({
					message: `${chalk.yellow.bold(
						`${selectedSource.name}`
					)} is a 3rd party plugin, and was not created by Evidence. Are you sure you would like to install it?`,
					initialValue: false
				});
				if (prompt.isCancel(unsafe) || !unsafe) {
					bail('Cancelled');
					return false;
				}
			}

			const pack = await readPackageJSON();
			if (!pack.dependencies) pack.dependencies = {};
			pack.dependencies[selectedSource.name] = selectedSource.version;
			await writePackageJSON(await resolvePackageJSON(), pack);
			prompt.log.info('package.json updated');

			if (!evidenceConfig.plugins.datasources) evidenceConfig.plugins.datasources = {};
			evidenceConfig.plugins.datasources[selectedSource.name] = {};
			await updateEvidenceConfig(evidenceConfig);
			prompt.log.info('evidence.config.yaml updated');

			break;
		}
	}
	return true;
};
