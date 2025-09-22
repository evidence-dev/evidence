import { workspace, FileStat, FileType, Uri, WorkspaceFolder } from 'vscode';

import { sendCommand } from '../terminal';
import { timeout } from '../utils/timer';
import { isServerRunning, stopServer } from './server';
import { statusBar } from '../statusBar';
import { getNodeVersion, isSupportedNodeVersion, promptToInstallNodeJsAndRestart } from '../node';
import { getWorkspaceFolder, updateProjectContext } from '../config';
import { telemetryService } from '../extension';
import { getPackageJsonFolder } from '../utils/jsonUtils';

/**
 * Node modules folder name to check in the open project workspace
 * for installed Evidence app NodeJS dependencies.
 *
 * @see https://docs.evidence.dev/getting-started/install-evidence
 */
const nodeModules = `node_modules`;

/**
 * Evidence node modules to update to the latest version.
 */
const evidencePackages: string[] = [
	'@evidence-dev/evidence@latest',
	'@evidence-dev/core-components@latest'
];

/**
 * Installs Evidence app NodeJS dependencies.
 *
 * @see https://docs.evidence.dev/getting-started/install-evidence
 */
export async function installDependencies() {
	// check if we need to run command in a different directory than root of the project:
	const workspaceFolderPath = workspace.workspaceFolders
		? workspace.workspaceFolders[0].uri.fsPath
		: '';
	const packageJsonFolder = await getPackageJsonFolder();
	const cdCommand = packageJsonFolder ? `cd ${packageJsonFolder} ; ` : '';
	const cdBackCommand = packageJsonFolder ? `; cd ${workspaceFolderPath}` : '';

	// check supported node version prior to server start
	const nodeVersion = await getNodeVersion();
	if (!isSupportedNodeVersion(nodeVersion)) {
		promptToInstallNodeJsAndRestart(nodeVersion);
	} else {
		if (await isServerRunning()) {
			stopServer();
			await timeout(1000);
		} else {
			// update open workspace context
			updateProjectContext();
		}

		sendCommand(`${cdCommand}npm install${cdBackCommand}`);
		await timeout(1000);
		statusBar.showInstalling();
		await timeout(25000);
		statusBar.showStart();
	}
}

/**
 * Updates all Evidence app librarires to the latest versions.
 */
export async function updateDependencies() {
	// check if we need to run command in a different directory than root of the project:
	const workspaceFolderPath = workspace.workspaceFolders
		? workspace.workspaceFolders[0].uri.fsPath
		: '';
	const packageJsonFolder = await getPackageJsonFolder();
	const cdCommand = packageJsonFolder ? `cd ${packageJsonFolder} ; ` : '';
	const cdBackCommand = packageJsonFolder ? `; cd ${workspaceFolderPath}` : '';

	if (await isServerRunning()) {
		stopServer();
		await timeout(1000);
	}
	sendCommand(`${cdCommand}npm install ${evidencePackages.join(' ')}${cdBackCommand}`);
	await timeout(5000);
	statusBar.showStart();

	telemetryService?.sendEvent('updateDependencies');
}

/**
 * Builds Evidence project for deployment.
 *
 * @see https://docs.evidence.dev/deployment/overview#build-process
 */
export async function buildProject() {
	if (await isServerRunning()) {
		stopServer();
		await timeout(1000);
	}
	runCommandWithDepInstall('npm run build');
	telemetryService?.sendEvent('build');
}

/**
 * Builds Evidence project in a strict mode.
 *
 * @see https://docs.evidence.dev/deployment/overview#buildstrict
 */
export async function buildProjectStrict() {
	if (await isServerRunning()) {
		stopServer();
		await timeout(1000);
	}
	runCommandWithDepInstall('npm run build:strict');
	telemetryService?.sendEvent('buildStrict');
}

/**
 * Checks node modules dependencies,
 * install them if they don't exist,
 * and sends the requested project build command
 * to the Evidence terminal instance.
 *
 * @param command Terminal command to execute.
 */
export async function runCommandWithDepInstall(command: string) {
	// check if we need to run command in a different directory than root of the project:
	const workspaceFolderPath = workspace.workspaceFolders
		? workspace.workspaceFolders[0].uri.fsPath
		: '';
	const packageJsonFolder = await getPackageJsonFolder();
	const cdCommand = packageJsonFolder ? `cd ${packageJsonFolder} ; ` : '';
	const cdBackCommand = packageJsonFolder ? `; cd ${workspaceFolderPath}` : '';

	// check supported node version prior to server start
	const nodeVersion = await getNodeVersion();
	if (!isSupportedNodeVersion(nodeVersion)) {
		promptToInstallNodeJsAndRestart(nodeVersion);
	} else {
		let depCommand = '';
		if (!(await hasDependencies())) {
			depCommand = `npm install ; `;
		}
		sendCommand(cdCommand + depCommand + command + cdBackCommand);
	}
}

/**
 * Checks if open Evidence project has /node_modules folder
 * and NodeJS dependencies installed.
 *
 * @see https://docs.evidence.dev/getting-started/install-evidence
 */
export async function hasDependencies(): Promise<boolean> {
	const workspaceFolder: WorkspaceFolder | undefined = getWorkspaceFolder();
	if (workspaceFolder) {
		const nodeModulesUri: Uri = Uri.joinPath(workspaceFolder.uri, nodeModules);
		try {
			const nodeModulesStat: FileStat = await workspace.fs.stat(nodeModulesUri);
			return nodeModulesStat.type === FileType.Directory;
		} catch (error) {
			return false;
		}
	}
	return false;
}
