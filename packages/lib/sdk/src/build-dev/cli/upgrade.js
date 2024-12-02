import { evidenceProjectOnlyNotice } from '../../lib/cli/notices.js';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { intro, outro, spinner } from '@clack/prompts';

function upgradePackages() {
	return /** @type {Promise<void>} */ (
		new Promise((resolve, reject) => {
			const child = spawn(
				'npm install @evidence-dev/evidence@latest @evidence-dev/core-components@latest @evidence-dev/component-utilities@latest @evidence-dev/sdk@latest @evidence-dev/tailwind@latest',
				{
					shell: true,
					detached: false,
					stdio: 'ignore'
				}
			);

			child.on('exit', function (code) {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Process exited with code ${code}`));
				}
			});

			child.on('error', function (err) {
				reject(err);
			});
		})
	);
}

/** @type {import("@brianmd/citty").CommandDef} */
export const upgrade = evidenceProjectOnlyNotice('upgrade', {
	meta: {
		name: 'upgrade',
		description: 'Upgrade your evidence project'
	},
	async run() {
		intro(chalk.inverse(' Upgrading Evidence '));

		const s = spinner();
		s.start('Installing via npm');

		upgradePackages()
			.then(() => {
				s.stop('Installed via npm');
				outro(chalk.greenBright(`Done`));
			})
			.catch((err) => {
				s.stop(chalk.redBright(`Error: ${err.message}`), 1);
			});
	}
});
