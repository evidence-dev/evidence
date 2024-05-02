import { sendCommand } from '../terminal';
import { timeout } from '../utils/timer';
import { isServerRunning, startServer, stopServer } from './server';
import { getTypesFromConnections, getPackageJsonFolder, isUSQL } from '../utils/jsonUtils';
import { telemetryService } from '../extension';
import { window, workspace } from 'vscode';

export async function runSources() {
	if (await isUSQL()) {
		let serverRunning = false;
		if (isServerRunning()) {
			serverRunning = true;
			stopServer();
			await timeout(1000);
		}

		// check if we need to run command in a different directory than root of the project:
		const workspaceFolderPath = workspace.workspaceFolders
			? workspace.workspaceFolders[0].uri.fsPath
			: '';
		const packageJsonFolder = await getPackageJsonFolder();
		const cdCommand = packageJsonFolder ? `cd ${packageJsonFolder} ; ` : '';
		const cdBackCommand = packageJsonFolder ? `; cd ${workspaceFolderPath}` : '';

		sendCommand(`${cdCommand}npm run sources${cdBackCommand}`);

		const sourceNames = await getTypesFromConnections();

		telemetryService?.sendEvent('runSources', { sources: sourceNames.join(', ') });

		if (serverRunning) {
			startServer();
		}
	} else {
		window.showErrorMessage(
			'Run Sources is only available in Evidence versions >= 24 (Universal SQL)'
		);
	}
}
