import { window, commands, env, workspace, Uri, ViewColumn } from 'vscode';

import { Commands } from './commands';
import { Context as ExtensionContext, Settings, getConfig, getWorkspaceFolder } from '../config';
import { getOutputChannel } from '../output';
import { closeTerminal, sendCommand } from '../terminal';
import { localAppUrl, openPageView } from './preview';
import { getNodeVersion, isSupportedNodeVersion, promptToInstallNodeJsAndRestart } from '../node';
import { statusBar } from '../statusBar';
import { timeout } from '../utils/timer';
import { isHostname, tryPort } from '../utils/httpUtils';
import { hasDependencies } from './build';
import { telemetryService } from '../extension';
import { hasManifest, getTypesFromConnections, getPackageJsonFolder } from '../utils/jsonUtils';
import { isProcessRunning } from '../utils/shellUtils';
import { Context } from 'mocha';

const localhost = ['127.0.0.1', '::1', 'localhost'];
// Formerly this was managed as a simple boolean variable which was problematic
// in a workspace extension in remote development scenarios.
// (namely, we often ended up with the _running variable being false
//  while the Evidence dev server launched by the extension is still up and running)
const _running = async (): Promise<boolean> => {
	const workspaceFolder = getWorkspaceFolder();
	if (!workspaceFolder) return false;

	return await isProcessRunning('evidence dev', workspaceFolder.uri.fsPath);
};
let _activePort: number = <number>getConfig(Settings.DefaultPort);

// Set a context key
const setContext = (key: any, value: any) => {
	commands.executeCommand('setContext', key, value);
};

/**
 * Creates Evidence app page Uri from the provided pageUrl,
 * and rewrites the host name for the host and port forwarding
 * when running in GitHub Codespaces.
 *
 * @param pageUrlPath Optional, the path part of the app Url
 * to be converted to an external app Url
 *
 * @returns External Url which can be safely opened in a browser
 * on the local system even when vscode is running remotely (e.g.
 * in code-server, using SSH, or in GitHub Codespaces)
 */
export async function getAppPageUri(pageUrlPath?: string): Promise<Uri> {
	const defaultPort = <number>getConfig(Settings.DefaultPort);

	// update active server port number
	if (!(await _running())) {
		//pageUri.authority.startsWith(localhost) && !isServerRunning()) {
		// get the next available localhost port number
		_activePort = await tryPort(defaultPort);
	}

	const internalServerUrl = `${localAppUrl}:${_activePort ?? defaultPort}`;

	// get external web page url
	let externalPageUri: Uri = await env.asExternalUri(Uri.parse(internalServerUrl));

	// it seems that "asExternalUri" only converts the host part of the Url to its
	// external form, and discards the path part of the Url when present. Hence this
	// should be added after the convertion to an external Url.
	if (pageUrlPath?.startsWith('/')) {
		// append page path to the external base path (e.g. /proxy/3710 + /another = /proxy/3710/another)
		// handle potential trailing/leading slashes to avoid double slashes
		const basePath = externalPageUri.path.endsWith('/') ? 
			externalPageUri.path.slice(0, -1) : externalPageUri.path;
		externalPageUri = externalPageUri.with({ path: basePath + pageUrlPath });
	}
		
	const outputChannel = getOutputChannel();
	outputChannel.appendLine(`Requested app page: ${externalPageUri.toString(true)}`); // skip encoding

	return externalPageUri;
}

/**
 * Starts Evidence app dev server, and opens Evidence app preview
 * in the built-in vscode simple browser.
 *
 * @param pageFileUri Optional (internal) Uri of the starting page 
 * to be loaded in the preview.
 */
export async function startServer(pageUri?: Uri) {

	if (await isServerRunning()) {
		window.showInformationMessage('There is an Evidence server already running!');
		return ;
	}

	telemetryService?.sendEvent('startServer');

	if (!pageUri) {
		pageUri = await getAppPageUri('/');
	}

	const pageHostname = pageUri.authority.split(':')[0];

	// check if we need to run command in a different directory than root of the project:
	const workspaceFolderPath = workspace.workspaceFolders
		? workspace.workspaceFolders[0].uri.fsPath
		: '';
	const packageJsonFolder = await getPackageJsonFolder();
	const cdCommand = packageJsonFolder ? `cd ${packageJsonFolder} ; ` : '';
	const cdBackCommand = packageJsonFolder ? `; cd ${workspaceFolderPath}` : '';

	const previewType: string = <string>getConfig(Settings.PreviewType);

	// check supported node version prior to server start
	const nodeVersion = await getNodeVersion();
	if (!isSupportedNodeVersion(nodeVersion)) {
		promptToInstallNodeJsAndRestart(nodeVersion);
		telemetryService?.sendEvent('nodeVersionError', { currentNodeVersion: nodeVersion });
	} else {
		// check for /node_modules before starting dev server
		let dependencyCommand = '';
		let depTimeout = 0;
		if (!(await hasDependencies())) {
			// prepend server run command with dependency install command:
			dependencyCommand = `npm install ; `;
			if (previewType.includes('internal')) {
				depTimeout = 25000;
				// install takes longer on windows
				if (process.platform === 'win32') {
					depTimeout += 20000;
				}
			}
			telemetryService?.sendEvent('installDependencies');
		}

		// Check if sources have been run. If not, tack on a run sources command
		// This checks if a manifest file exists. If not, run sources on server start
		let sourcesCommand = '';
		// if there's no manifest, either the project is unbuilt, or it's legacy - either way there's nothing to show
		if (!(await hasManifest())) {
			sourcesCommand = `npm run sources ; `;
			const sourceNames = await getTypesFromConnections();

			telemetryService?.sendEvent('runSources', { sources: sourceNames.join(', ') });
		}

		if (!(await _running())) {
			// use the last saved active port number to start dev server if using simple browser
			let serverPortParameter = ` --port ${_activePort}`;

			let devServerHostParameter: string = '';
			if (!localhost.includes(pageHostname)) {
				// use remote host parameter to start dev server on github codespaces
				devServerHostParameter = ' --host 0.0.0.0';
			}

			let previewParameter: string = '';
			if (previewType === 'external') {
				previewParameter = ' --open /';
				serverPortParameter = '';
			}

			let envVariables: string = '';
			if (isHostname(pageHostname)) {
				envVariables += `EVIDENCE_ALLOWED_HOST=${pageHostname} `;
			}

			if (!(['', '/'].includes(pageUri.path))) {
				envVariables += `EVIDENCE_BASE_PATH=${pageUri.path.replace(/\/$/, '')} `;
			}

			// prepare disable flags for automatic source building
			let disableFlags = '';
			if (getConfig(Settings.DisableAutoSourceBuilding, false)) {
				disableFlags = ' --disable-watchers sources,queries --disable-hmr sources,queries';
			}

			// start dev server via terminal command
			sendCommand(
				`${cdCommand}${dependencyCommand}${sourcesCommand}${envVariables}npm exec evidence dev --${devServerHostParameter}${serverPortParameter}${previewParameter}${disableFlags}${cdBackCommand}`
			);
		}

		statusBar.showInstalling();
		await timeout(depTimeout);

		// update server status and show running status bar icon
		statusBar.showRunning();

		setContext(ExtensionContext.IsServerRunning, true);

		if (previewType.includes('internal')) {
			// wait for the dev server to start
			await timeout(1000);

			// wait for the server to process pages
			await timeout(5000);

			// server start takes longer on windows
			if (process.platform === 'win32') {
				await timeout(20000);
			}
		}

		if (await _running()) {
			// set focus back to the active vscode editor group
			commands.executeCommand(Commands.FocusActiveEditorGroup);

			// open app preview if previewType is set to internal (simple browser)
			openPageView(pageUri);

			// change button to stop server
			statusBar.showStop();
		}
	}
}

/**
 * Gets running server status.
 *
 * @returns True if Evidence dev server is running, and false otherwise.
 */
export async function isServerRunning() {
	return await _running();
}

/**
 * Gets active port number for Evidence app dev server.
 *
 * @returns Active port number.
 */
export function getActivePort() {
	return _activePort;
}

/**
 * Stops running app dev server,
 * resets active port number,
 * and closes Evidence app terminal.
 */
export async function stopServer() {
	// if (_running) {
	//   sendCommand('q', '', false);
	// }

	// close Evidence server terminal instance
	closeTerminal();

	// reset server state and status display
	setContext(ExtensionContext.IsServerRunning, false);
	_activePort = <number>getConfig(Settings.DefaultPort);
	statusBar.showStart();
	telemetryService?.sendEvent('stopServer');
}

