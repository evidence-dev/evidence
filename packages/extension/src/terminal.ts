import { window, ExtensionContext, OutputChannel, Terminal } from 'vscode';

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
// Formerly this was managed as a simple variable which was problematic
// in a workspace extension in remote development scenarios.
// (namely, we often ended up with the _terminal variable being undefined
//  while the Terminal launched by the extension is still up and running)
let _terminal: () => Terminal | undefined = () =>
		window.terminals.find(terminal => terminal.name === terminalName);
let _outputChannel: OutputChannel | undefined;
let _nodeVersion: string | undefined;
let _currentDirectory: string | undefined;

/**
 * Gets Evidence treminal instance.
 *
 * @param context VScode extension context.
 * @param workingDirectory Optional working directory path to cd to.
 * @returns VScode Terminal instance.
 */
async function getTerminal(
	_context: ExtensionContext,
	workingDirectory?: string
): Promise<Terminal> {
	_outputChannel = getOutputChannel();

	let terminal = _terminal();
	if (terminal === undefined) {
		terminal = window.createTerminal(terminalName);
		terminal.show(false);
		_nodeVersion = await getNodeVersion();
		_outputChannel.appendLine(`Using node ${_nodeVersion}`);
		_currentDirectory = undefined;
	}

	if (_currentDirectory !== workingDirectory && workingDirectory && workingDirectory.length > 0) {
		terminal.sendText(`cd "${workingDirectory}"`, true); // add new line
		_currentDirectory = workingDirectory;
	}

	return terminal;
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
	const terminal = _terminal();
	if (terminal !== undefined) {
		terminal.show(false);
		terminal.sendText(`\x03`);
		terminal.dispose();
	}
}
