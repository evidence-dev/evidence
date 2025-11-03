import { sendCommand } from '../terminal';
import { timeout } from '../utils/timer';
import { isServerRunning, startServer, stopServer } from './server';
import { getTypesFromConnections, getPackageJsonFolder } from '../utils/jsonUtils';
import { telemetryService } from '../extension';
import { workspace } from 'vscode';

export async function runSources() {
	let serverRunning = false;
	if (await isServerRunning()) {
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
}
