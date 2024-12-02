import { loadEnv } from 'vite';
import { evidenceProjectOnlyNotice } from '../../lib/cli/notices.js';
import path from 'path';
import { projectRoot } from '../../lib/projectRoot.js';
import { copyToLayout } from '../../plugins/layouts/copyToLayout.js';
import { build as viteBuild } from 'vite';

/** @type {import("@brianmd/citty").CommandDef} */
export const build = evidenceProjectOnlyNotice('build', {
	meta: {
		name: 'build',
		description: 'Build your evidence project'
	},
	async run() {
		const loadedEnv = loadEnv('', '.', ['VITE_', 'EVIDENCE_']);
		Object.assign(process.env, loadedEnv);

		await copyToLayout();
		let templateRoot = path.join(projectRoot, '.evidence', 'template');

		process.chdir(templateRoot);

		await viteBuild({
			build: {
				emptyOutDir: true,
				outDir: '../../build'
			}
		});
	}
});
