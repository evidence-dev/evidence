import { commands, env, workspace, Uri } from 'vscode';

import { Commands } from './commands';
import { Settings, getConfig } from '../config';
import { getOutputChannel } from '../output';
import { closeTerminal, sendCommand } from '../terminal';
import { localAppUrl, preview } from './preview';
import { getNodeVersion, isSupportedNodeVersion, promptToInstallNodeJsAndRestart } from '../node';
import { statusBar } from '../statusBar';
import { timeout } from '../utils/timer';
import { isHostname, tryPort } from '../utils/httpUtils';
import { hasDependencies } from './build';
import { telemetryService } from '../extension';
import { hasManifest, getTypesFromConnections, getPackageJsonFolder } from '../utils/jsonUtils';

const localhost = ['127.0.0.1', '::1', 'localhost'];
let _running: boolean = false;
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
 * @param pageUrl Optional target web page Url.
 *
 * @returns Rewritten page Uri with the active server port number,
 * and rewritten host name for the host and port forwarding
 * when running in GitHub Codespaces.
 */
export async function getAppPageUri(pageUrl?: string): Promise<Uri> {
	const defaultPort = <number>getConfig(Settings.DefaultPort);
	const serverUrl = `${localAppUrl}:${defaultPort}`;
	if (pageUrl === undefined) {
		pageUrl = serverUrl;
	} else if (pageUrl.startsWith('/')) {
		// construct page url for page path wihtout host and port
		pageUrl = `${localAppUrl}:${defaultPort}${pageUrl}`;
	}

	// get external web page url
	let pageUri: Uri = await env.asExternalUri(Uri.parse(pageUrl));

	// update active server port number
	if (!_running) {
		//pageUri.authority.startsWith(localhost) && !isServerRunning()) {
		// get the next available localhost port number
		_activePort = await tryPort(defaultPort);
	}

	// rewrite requested app page url to use the new active localhost server port
	pageUri = Uri.parse(
		pageUri
			.toString(true) // skip encoding
			.replace(`:${defaultPort}/`, `:${_activePort}/`)
	);

	const outputChannel = getOutputChannel();
	outputChannel.appendLine(`Requested app page: ${pageUri.toString(true)}`); // skip encoding
	return pageUri;
}

/**
 * Starts Evidence app dev server, and opens Evidence app preview
 * in the built-in vscode simple browser.
 *
 * @param pageFileUri Optional Uri of the starting page to load in preview.
 */
export async function startServer(pageUri?: Uri) {
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

		if (!_running) {
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

		_running = true;
		setContext('evidence.serverRunning', _running);

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

		if (_running === true) {
			// set focus back to the active vscode editor group
			commands.executeCommand(Commands.FocusActiveEditorGroup);

			// open app preview if previewType is set to internal (simple browser)
			if (previewType === 'internal' || previewType === 'internal - side-by-side') {
				preview(pageUri);
			}

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
export function isServerRunning() {
	return _running;
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
	_running = false;
	setContext('evidence.serverRunning', _running);
	_activePort = <number>getConfig(Settings.DefaultPort);
	statusBar.showStart();
	telemetryService?.sendEvent('stopServer');
}
