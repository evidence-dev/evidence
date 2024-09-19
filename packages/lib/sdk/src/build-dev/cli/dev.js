import { evidenceProjectOnlyNotice } from '../../lib/cli/notices.js';
import { createServer, loadEnv } from 'vite';
import chalk from 'chalk';
import { copyToLayout } from '../../plugins/layouts/copyToLayout.js';
import path from 'path';
import { projectRoot } from '../../lib/projectRoot.js';

/** @type {import("@brianmd/citty").CommandDef} */
export const dev = evidenceProjectOnlyNotice('dev', {
	meta: {
		name: 'dev',
		description: 'Run the evidence dev server'
	},
	async run({ rawArgs }) {
		// TODO: Should we use vite's built in loadEnv function?

		const loadedEnv = loadEnv('', '.', ['VITE_', 'EVIDENCE_']);
		Object.assign(process.env, loadedEnv);

		console.clear();
		await copyToLayout();

		let templateRoot = path.join(projectRoot, '.evidence', 'template');

		process.chdir(templateRoot);

		/** @type {import("vite").InlineConfig} */
		const viteConfig = {
			server: {
				host: rawArgs.includes('--host')
			}
		};

		const server = await createServer(viteConfig);

		await server.listen(3000);

		console.log(chalk.dim(`Running in ${process.cwd()}`));

		console.log(chalk.bold('     Your Evidence project has started!'));
		console.log('');
		console.log('     You can access it at the following URLs:');

		server.printUrls();

		// TODO: We could add a keyboard shortcut here for running sources; might be cute
		server.bindCLIShortcuts({ print: true });
	}
});
