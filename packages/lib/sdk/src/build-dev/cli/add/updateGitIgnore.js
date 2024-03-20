import { findFile } from 'pkg-types';
import fs from 'fs/promises';
import path from 'path';

export const updateGitIgnore = async () => {
	const gitIgnorePath = await findFile('.gitignore').catch(() =>
		path.join(process.cwd(), '.gitignore')
	);

	const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf-8').catch(() => '');
	const gitIgnoreLines = gitIgnoreContent.split('\n');
	const initialLines = gitIgnoreLines.length;

	const evidenceIgnorePatterns = [
		'.evidence', // internal directory
		'connection.options.yaml' // can contain credentials
	];

	for (const pattern of evidenceIgnorePatterns) {
		// This matches case sensitive and exact matches intentionally

		if (!gitIgnoreLines.some((line) => line.trim() === pattern.trim()))
			gitIgnoreLines.push(
				`# Automatically ignored by Evidence, this should not be source controlled`,
				`${pattern}`
			);
	}

	if (gitIgnoreLines.length > initialLines) {
		// added lines, rewrite file
		await fs.writeFile(gitIgnorePath, gitIgnoreLines.join('\n'));
	}
};
