import { window, OutputChannel } from 'vscode';

/**
 * Evidence output channel title.
 */
const channelName = 'Evidence';

/**
 * Evidence output channel instance.
 */
let _outputChannel: OutputChannel | undefined;

/**
 * Gets Evidence treminal instance.
 *
 * @param context VScode extension context.
 * @param workingDirectory Optional working directory path to cd to.
 * @returns VScode Terminal instance.
 */
export function getOutputChannel(): OutputChannel {
	if (_outputChannel === undefined) {
		_outputChannel = window.createOutputChannel(channelName);
		_outputChannel.appendLine(`Evidence dev server and extension logging output:`);
	}
	return _outputChannel;
}

/**
 * Shows Evidence extension output channel in the Output view.
 */
export function showOutput() {
	getOutputChannel().show();
}
