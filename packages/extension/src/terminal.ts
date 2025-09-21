import { env, window, Disposable, ExtensionContext, OutputChannel, Terminal, Uri } from 'vscode';

import { getExtensionContext } from './extensionContext';
import { getNodeVersion, isSupportedNodeVersion, promptToInstallNodeJsAndRestart } from './node';
import { getOutputChannel } from './output';

/**
 * Evidence terminal title.
 */
const terminalName = 'Evidence';

/**
 * Evidence terminal instance.
 */
let _terminal: Terminal | undefined;
let _outputChannel: OutputChannel | undefined;
let _nodeVersion: string | undefined;
let _currentDirectory: string | undefined;
let _disposable: Disposable | undefined;

/**
 * Gets Evidence treminal instance.
 *
 * @param context VScode extension context.
 * @param workingDirectory Optional working directory path to cd to.
 * @returns VScode Terminal instance.
 */
async function getTerminal(
	context: ExtensionContext,
	workingDirectory?: string
): Promise<Terminal> {
	_outputChannel = getOutputChannel();
	if (_terminal === undefined) {
		_terminal = window.createTerminal(terminalName);
		_terminal.show(false);
		// _terminal.sendText('node -v');
		_nodeVersion = await getNodeVersion();
		_outputChannel.appendLine(`Using node ${_nodeVersion}`);

		// dispose this terminal when terminal panel is closed
		_disposable = window.onDidCloseTerminal((e: Terminal) => {
			if (e.name === terminalName) {
				_terminal = undefined;
				_disposable?.dispose();
				_disposable = undefined;
			}
		});

		context.subscriptions.push(_disposable);
		_currentDirectory = undefined;
	}

	if (_currentDirectory !== workingDirectory && workingDirectory && workingDirectory.length > 0) {
		_terminal.sendText(`cd "${workingDirectory}"`, true); // add new line
		_currentDirectory = workingDirectory;
	}

	return _terminal;
}

/**
 * Sends command to terminal.
 *
 * @param command Command name.
 * @param workingDirectory Optional working directory path to cd to.
 * @param preserveFocus Preserve current window focus.
 */
export async function sendCommand(
	command: string,
	workingDirectory?: string,
	preserveFocus?: boolean
): Promise<void> {
	const terminal = await getTerminal(getExtensionContext(), workingDirectory);
	terminal.show(preserveFocus);

	// check node version
	// @see https://docs.evidence.dev/getting-started/install-evidence#system-requirements
	if (isSupportedNodeVersion(_nodeVersion!)) {
		// execute terminal command
		terminal.sendText(command, true); // add new line

		// get running terminal command process id
		const processId = await terminal.processId;
		if (processId) {
			_outputChannel?.appendLine(`Running command: ${command}`);
			_outputChannel?.appendLine(`- Process Id: ${processId}\n`);
		}
	} else {
		promptToInstallNodeJsAndRestart(_nodeVersion);
	}
}

/**
 * Closes active Evidence app terminal.
 */
export function closeTerminal() {
	if (_terminal) {
		_terminal.show(false);
		// Send Ctrl+C to stop the running process
		_terminal.sendText(`\x03`);
		_terminal.dispose();
		_terminal = undefined;
	}
}
