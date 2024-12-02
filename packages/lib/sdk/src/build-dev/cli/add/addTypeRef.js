import { findFile } from 'pkg-types';
import fs from 'fs/promises';
import { log } from '@clack/prompts';

export const addTypeRef = async () => {
	const appDTs = await findFile('src/app.d.ts').catch(() => {
		log.warn('Could not find app.d.ts file; types will not be installed');
		return;
	});
	if (!appDTs) return;

	const appDTsContent = await fs.readFile(appDTs, 'utf-8');
	const lines = appDTsContent.split('\n');
	const refLine = `/// <reference types="@evidence-dev/sdk" />`;
	if (!lines.includes(refLine)) {
		lines.splice(0, 0, refLine); // Insert at beginning of file
		await fs.writeFile(appDTs, lines.join('\n'));
	}
};
