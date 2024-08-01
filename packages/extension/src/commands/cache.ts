import { window, workspace } from 'vscode';
import { deleteFolder } from '../utils/fsUtils';
import { telemetryService } from '../extension';
import * as path from 'path';

/**
 * Evidence application cache directories.
 */
let cachePath = '';
if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
	const workspaceFolderPath = workspace.workspaceFolders[0].uri.fsPath;
	cachePath = path.join(workspaceFolderPath, '.evidence', 'template', '.evidence-queries');
}

/**
 * Deletes Evidence application cache directory.
 */
export async function clearCache() {
	if (!cachePath) {
		window.showErrorMessage('No workspace folder is open.');
		return;
	}

	if (await deleteFolder(cachePath)) {
		window.showInformationMessage('Cache cleared.');
	} else {
		window.showInformationMessage('Cache is already empty.');
	}
	telemetryService?.sendEvent('clearCache');
}
