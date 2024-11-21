import { exec } from 'child_process';
import { window, env, ExtensionContext, Uri } from 'vscode';
import { showRestartPrompt } from './views/prompts';
import { getExtensionContext } from './extensionContext';

const downloadNodeJs = 'Download NodeJS (LTS Version)';
const downloadNodeJsUrl = 'https://nodejs.org/en/download';

/**
 * Gets NodeJS version.
 *
 * @returns The NodeJS version.
 */
export async function getNodeVersion() {
	let nodeVersion;
	try {
		nodeVersion = await executeCommand('node --version');
	} catch (e) {
		nodeVersion = 'none';
	}
	return nodeVersion;
}

/**
 * Checks if the provided NodeJS version string
 * meets the major and minor version requirements.
 *
 * @param nodeVersion NodeJS version string to check.
 *
 * @returns True if NodeJS version is equal or greater
 *  than the major version numbers, and false otherwise.
 */
export function isSupportedNodeVersion(nodeVersion: string): boolean {
	// Minimum version of NodeJS required for Evidence:
	const minMajorVersion = 18;

	// Maximum version of NodeJS required for Evidence:
	const maxMajorVersion = 22;

	// check node version
	if (nodeVersion && nodeVersion.startsWith('v')) {
		const nodeVersionNumbers = nodeVersion.replace('v', '').split('.');
		const majorVersionNumber = parseInt(nodeVersionNumbers[0]);

		let aboveMinVersion = false;
		let belowMaxVersion = false;

		// Check if above min version:
		if (majorVersionNumber >= minMajorVersion) {
			aboveMinVersion = true;
		}

		// Check if below max version:
		if (majorVersionNumber <= maxMajorVersion) {
			belowMaxVersion = true;
		}

		return aboveMinVersion && belowMaxVersion;
	}
	return false;
}

/**
 * Gets NPM version.
 *
 * @returns The NPM version.
 */
export async function getNpmVersion() {
	return await executeCommand('npm --version');
}

/**
 * Executes command using node child_process.exec.
 *
 * @see https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
 *
 * @param command The node command to execute.
 * @returns The stdout of the executed command.
 */
export function executeCommand(command: string): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				resolve(stdout);
			}
		});
	});
}

export async function promptToInstallNodeJsAndRestart(currentVersion: string | undefined) {
	const context = getExtensionContext();
	const nodeErrorCountKey = 'nodeErrorCount';
	const errorCount = context.globalState.get(nodeErrorCountKey, 0);
	context.globalState.update(nodeErrorCountKey, errorCount + 1);

	if (errorCount >= 1) {
		promptForHelp();
	}

	const downloadNodeNotification = await window.showErrorMessage(
		currentVersion
			? `Evidence requires NodeJS above v18.13, v20, or v22 - your NodeJS version is ${currentVersion}`
			: `Evidence requires NodeJS above v18.13, v20, or v22`,
		{ title: downloadNodeJs }
	);

	if (downloadNodeNotification?.title === downloadNodeJs) {
		env.openExternal(Uri.parse(downloadNodeJsUrl));
	}

	showRestartPrompt();
}

export async function promptForHelp() {
	const helpNotification = await window.showWarningMessage(
		`Having issues installing NodeJS? Try Evidence in Codespaces or reach out to us in Slack`,
		{ title: `Try in Codespaces` },
		{ title: `Chat in Evidence Slack` }
	);

	if (helpNotification?.title === `Chat in Evidence Slack`) {
		await env.openExternal(Uri.parse('https://slack.evidence.dev'));
	} else if (helpNotification?.title === `Try in Codespaces`) {
		await env.openExternal(
			Uri.parse(
				'https://github.com/codespaces/new?machine=standardLinux32gb&repo=399252557&ref=main&geo=UsEast'
			)
		);
	}
}
