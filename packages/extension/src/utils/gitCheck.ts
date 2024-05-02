import * as fs from 'fs';
import * as path from 'path';

export function isGitRepository(folderPath: string): boolean {
	const gitPath = path.join(folderPath, '.git');
	return fs.existsSync(gitPath);
}
