/* eslint-disable @typescript-eslint/naming-convention */
import { commands, workspace, WorkspaceFolder } from 'vscode';

import { Commands } from './commands/commands';
import { getExtensionContext } from './extensionContext';

/**
 * VSCode and Evidence extension settings.
 */
export const enum Settings {
	DefaultPort = 'defaultPort',
	AutoStart = 'autoStart',
	TemplateProjectUrl = 'templateProjectUrl',
	PreviewType = 'previewType',
	SlashCommands = 'slashCommands',
	AllowedHost = 'allowedHost',
	BasePath = 'basePath',
	DisableAutoSourceBuilding = 'disableAutoSourceBuilding',
	PreviewDelay = 'previewDelay'
}

/**
 * Evidence extension context and state keys.
 */
export const enum Context {
	HasEvidenceProject = 'evidence.hasProject'
}

/**
 * Gets Evidence extension configuration setting.
 *
 * @param settingName Configuration setting name.
 * @param defaultValue Optional efault setting value to use when not found.
 * @returns
 */
export function getConfig<T>(settingName: string, defaultValue?: T) {
	return workspace.getConfiguration().get(`evidence.${settingName}`, defaultValue);
}

/**
 * Updates Evidence project context values to show
 * the available Evidence project commands in Command Palette,
 * and determine standard markdown documents Preview webview to use.
 *
 * @see https://github.com/evidence-dev/evidence-vscode/issues/67
 */
export function updateProjectContext() {
	// set Evidence has project context valule flag
	// for enabledment of commands that require an open Evidence project
	commands.executeCommand(Commands.SetContext, Context.HasEvidenceProject, true);

	// set Evidence project workspace flag to check
	// when markdown document preview is requested
	getExtensionContext().workspaceState.update(Context.HasEvidenceProject, true);
}

/**
 * Gets the first workspace folder.
 *
 * @see https://code.visualstudio.com/docs/editor/multi-root-workspaces
 *
 * @returns {WorkspaceFolder | undefined} The first workspace folder.
 */
export function getWorkspaceFolder(): WorkspaceFolder | undefined {
	const workspaceFolders = workspace.workspaceFolders;
	if (workspaceFolders) {
		return workspaceFolders[0];
	}
	return undefined;
}
