import * as prompt from '@clack/prompts';
import { updateSvelteConfig } from './add/updateSvelteConfig.js';
import { updatePackageJson } from './add/updatePackageJson.js';
import { updateViteConfig } from './add/updateViteConfig.js';
import { createEvidenceConfig } from '../../configuration/createEvidenceConfig.js';
import { updateGitIgnore } from './add/updateGitIgnore.js';
import { addTypeRef } from './add/addTypeRef.js';

import fs from 'fs/promises';
import path from 'path';
import { installPluginPrompt } from '../../plugins/cli/install.prompt.js';

import chalk from 'chalk';
import { projectRoot } from '../../lib/projectRoot.js';
import { addServerHook } from './add/addServerHook.js';
import { EvidenceError } from '../../lib/EvidenceError.js';

/** @type {import("@brianmd/citty").CommandDef} */
export const add = {
	meta: {
		name: 'add',
		description: 'Add evidence to your Svelte project'
	},
	async run() {
		prompt.intro('Installing Evidence SDK in your project');
		await updateGitIgnore();
		prompt.log.step('Updated .gitignore');
		await updatePackageJson();
		prompt.log.step('Updated package.json');
		await updateSvelteConfig();
		prompt.log.step('Updated svelte configuration');
		await updateViteConfig();
		prompt.log.step('Updated vite configuration');
		await addTypeRef();
		prompt.log.step('Added type reference');

		// TODO: Detect if we are in a sveltekit project
		await addServerHook();
		prompt.log.step('Server hook configured');
		await createEvidenceConfig()
			.then(() => {
				prompt.log.step('Created evidence.config.yaml');
			})
			.catch((e) => {
				if (e instanceof EvidenceError && e.message.includes('Configuration file already exists')) {
					console.debug(chalk.dim('Did not create evidence.config.yaml, already exists'));
				} else {
					throw e;
				}
			});

		await fs.mkdir(path.resolve(projectRoot, 'sources'), { recursive: true });

		prompt.log.step('Created sources directory');

		const installSources = await prompt.confirm({
			message: 'Would you like to install a datasource?'
		});
		if (installSources === true) {
			const result = await installPluginPrompt(true, 'datasource', true);
			if (result) {
				prompt.log.info(
					`Plugin installed! Run ${chalk.bold('npm i')} to install it and ${chalk.bold(
						'npx evidence-sdk connections edit'
					)} to set up a connection.`
				);
			} else {
				prompt.log.warn(
					`You did not install any plugins; install one manually, or use ${chalk.bold(
						'npx evidence-sdk plugins install'
					)} for an interactive helper.`
				);
			}
		} else {
			prompt.log.warn(
				`You did not install any plugins; install one manually, or use ${chalk.bold(
					'npx evidence-sdk plugins install'
				)} for an interactive helper.`
			);
		}

		prompt.log.info(
			[
				chalk.bold('Thanks for trying out the Evidence SDK Preview!'),
				'Please note that the interfaces in the preview are unstable, and bugs are to be expected',
				'We do not consider this ready for production yet.',
				'If you encounter issues, you can report them on GitHub:' +
					chalk.bold('https://github.com/evidence-dev/sdk/issues/new'),
				chalk.green("Happy SQL'ing! 🎉")
			].join('\n')
		);

		prompt.outro('Evidence SDK Installed!');
	}
};
