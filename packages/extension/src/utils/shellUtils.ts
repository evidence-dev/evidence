import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Checks if a process with given command is running in the specified directory
 */
export async function isProcessRunning(
	command: string,
	workingDirectory: string
): Promise<boolean> {
	try {
		// On Unix-like systems (including WSL)
		const { stdout } = await execAsync(
			`ps aux | grep "${command}" | grep -v grep | grep "${workingDirectory}"`
		);
		return stdout.trim().length > 0;
	} catch {
		return false;
	}
}

/**
 * Gets process ID for a command running in specified directory
 */
export async function getProcessId(
	command: string,
	workingDirectory: string
): Promise<number | undefined> {
	try {
		const { stdout } = await execAsync(
			`ps aux | grep "${command}" | grep -v grep | grep "${workingDirectory}" | awk '{print $2}'`
		);
		const pid = parseInt(stdout.trim().split('\n')[0]);
		return isNaN(pid) ? undefined : pid;
	} catch {
		return undefined;
	}
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
				resolve(stdout.trim());
			}
		});
	});
}

/**
 * Executes command using the user's login shell to load version manager environments.
 * This works with asdf, nvm, fnm, volta, and other version managers.
 *
 * @param command The command to execute.
 * @param cwd Optional working directory.
 * @returns The stdout of the executed command.
 */
export function executeShellCommand(command: string, cwd?: string): Promise<string> {
	return new Promise((resolve, reject) => {
		// Use login shell to load user's environment (version managers)
		const shell = process.env.SHELL || '/bin/bash';
		const shellCommand = `${shell} -l -c "${command}"`;

		exec(shellCommand, { cwd }, (error, stdout, _stderr) => {
			if (error) {
				reject(error);
			} else {
				resolve(stdout.trim());
			}
		});
	});
}