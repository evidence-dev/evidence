import { commands, env, workspace, Uri } from 'vscode';

import { Commands } from './commands';
import { Settings, getConfig } from '../config';
import { getOutputChannel } from '../output';
import { closeTerminal, sendCommand } from '../terminal';
import { getLocalAppUrl, preview } from './preview';
import { getNodeVersion, isSupportedNodeVersion, promptToInstallNodeJsAndRestart } from '../node';
import { statusBar } from '../statusBar';
import { timeout } from '../utils/timer';
import { tryPort } from '../utils/httpUtils';
import { hasDependencies } from './build';
import { telemetryService } from '../extension';
import { hasManifest, getTypesFromConnections, getPackageJsonFolder } from '../utils/jsonUtils';

const localhost = 'localhost';
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
	const allowedHost = getConfig(Settings.AllowedHost, '');

	let baseUrl: string;
	if (allowedHost) {
		// Use configured host (for proxy setups) - don't add port
		baseUrl = getLocalAppUrl();
	} else {
		// Use localhost with port
		baseUrl = `${getLocalAppUrl()}:${defaultPort}`;
	}

	if (pageUrl === undefined) {
		pageUrl = baseUrl;
	} else if (pageUrl.startsWith('/')) {
		// construct page url for page path without host and port
		pageUrl = `${baseUrl}${pageUrl}`;
	}

	// update active server port number (only for localhost)
	if (!_running && !allowedHost) {
		// get the next available localhost port number
		_activePort = await tryPort(defaultPort);

		// rewrite requested app page url to use the new active localhost server port
		pageUrl = pageUrl.replace(`:${defaultPort}/`, `:${_activePort}/`);
	}

	// get external web page url (after port has been finalized)
	let pageUri: Uri = await env.asExternalUri(Uri.parse(pageUrl));

	// TEST: let's see what asExternalUri gives us for localhost
	const testLocalhostUrl = `http://localhost:${_activePort}${pageUrl.includes('/') ? pageUrl.split('/').slice(-1)[0] : ''}`;
	const testPageUri: Uri = await env.asExternalUri(Uri.parse(testLocalhostUrl));

	const outputChannel = getOutputChannel();
	outputChannel.appendLine(`Original pageUrl: ${pageUrl}`);
	outputChannel.appendLine(`Test localhost URL: ${testLocalhostUrl}`);
	outputChannel.appendLine(`Test asExternalUri result: ${testPageUri.toString(true)}`);
	outputChannel.appendLine(`Actual pageUri: ${pageUri.toString(true)}`); // skip encoding
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
			if (!pageUri.authority.startsWith(localhost)) {
				// use remote host parameter to start dev server on github codespaces
				devServerHostParameter = ' --host 0.0.0.0';
			}

			let previewParameter: string = '';
			if (previewType === 'external') {
				previewParameter = ' --open /';
				serverPortParameter = '';
			}

			// prepare environment variables for Evidence CLI
			const allowedHost = getConfig(Settings.AllowedHost, '');
			const basePath = getConfig(Settings.BasePath, '');
			const disableAutoBuilding = getConfig(Settings.DisableAutoSourceBuilding, false);

			let envVars = '';
			if (allowedHost) {
				envVars += `EVIDENCE_ALLOWED_HOST=${allowedHost} `;
			}
			if (basePath) {
				envVars += `EVIDENCE_BASE_PATH=${basePath} `;
			}

			// prepare disable flags for automatic source building
			let disableFlags = '';
			if (disableAutoBuilding) {
				disableFlags = ' --disable-watchers sources,queries --disable-hmr sources,queries';
			}

			// start dev server via terminal command
			sendCommand(
				`${cdCommand}${dependencyCommand}${sourcesCommand}${envVars}npm exec evidence dev --${devServerHostParameter}${serverPortParameter}${previewParameter}${disableFlags}${cdBackCommand}`
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
				const previewDelay = getConfig(Settings.PreviewDelay, 0) as number;
				if (previewDelay > 0) {
					// Add delay for Cloudflare tunnels or slow proxy setups
					setTimeout(() => {
						preview(pageUri);
					}, previewDelay * 1000);
				} else {
					preview(pageUri);
				}
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
