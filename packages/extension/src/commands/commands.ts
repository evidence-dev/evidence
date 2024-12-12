/* eslint-disable @typescript-eslint/naming-convention */
import { commands, window, Disposable, ExtensionContext } from 'vscode';

import { installDependencies, updateDependencies, buildProject, buildProjectStrict } from './build';

import { runSources } from './sources';

import {
	createNewProject,
	openIndex,
	openWalkthrough,
	copyProject
} from './project';
import { createProjectFromTemplate } from './template';
import { startServer, stopServer } from './server';
import { preview } from './preview';
import { createTemplatedPageFromQuery } from './documents';
import { openSettingsFile, viewExtensionSettings, viewAppSettings } from './settings';
import { clearCache } from './cache';
import { showOutput } from '../output';

/**
 * VSCode and Evidence extension commands.
 */
export const enum Commands {
	// VS Code and built-in extensions commands
	Open = 'vscode.open',
	OpenFolder = 'vscode.openFolder',
	OpenSettings = 'workbench.action.openSettings',
	FocusActiveEditorGroup = 'workbench.action.focusActiveEditorGroup',
	NewWindow = 'workbench.action.newWindow',
	ReloadWindow = 'workbench.action.reloadWindow',
	MarkdownShowPreview = 'markdown.showPreview',
	ShowSimpleBrowser = 'simpleBrowser.show',
	SetContext = 'setContext',
	OpenWalkthrough = 'workbench.action.openWalkthrough',
	ReloadTerminal = 'workbench.action.terminal.restart',

	// Evidence extension commands
	NewProject = 'evidence.newProject',
	CreateProjectFromTemplate = 'evidence.createProjectFromTemplate',
	CopyProject = 'evidence.copyProject',
	OpenProjectSettings = 'evidence.openSettings',
	InstallDependencies = 'evidence.installDependencies',
	UpdateDependencies = 'evidence.updateDependencies',
	StartServer = 'evidence.startServer',
	StopServer = 'evidence.stopServer',
	PreviewApp = 'evidence.preview',
	ViewExtensionSettings = 'evidence.viewSettings',
	ViewAppSettings = 'evidence.viewAppSettings',
	ClearCache = 'evidence.clearCache',
	BuildProject = 'evidence.build',
	BuildProjectStrict = 'evidence.buildStrict',
	RunSources = 'evidence.runSources',
	ShowOutput = 'evidence.showOutput',
	OpenIndex = 'evidence.openIndex',
	OpenEvidenceWalkthrough = 'evidence.openWalkthrough',
	CreateTemplatedPageFromQuery = 'evidence.createTemplatedPageFromQuery',
	OpenSimpleBrowser = 'simpleBrowser.api.open'
}

let _context: ExtensionContext;

/**
 * Registers Evidence extension commands.
 *
 * @param context Extension context.
 */
export function registerCommands(context: ExtensionContext) {
	_context = context;

	// register Evidence extension commands
	registerCommand(Commands.NewProject, createNewProject);
	registerCommand(Commands.CreateProjectFromTemplate, createProjectFromTemplate);
	registerCommand(Commands.CopyProject, copyProject);
	registerCommand(Commands.OpenProjectSettings, openSettingsFile);
	registerCommand(Commands.InstallDependencies, installDependencies);
	registerCommand(Commands.UpdateDependencies, updateDependencies);
	registerCommand(Commands.StartServer, startServer);
	registerCommand(Commands.StopServer, stopServer);
	registerCommand(Commands.PreviewApp, preview);
	registerCommand(Commands.ViewExtensionSettings, viewExtensionSettings);
	registerCommand(Commands.ViewAppSettings, viewAppSettings);
	registerCommand(Commands.ClearCache, clearCache);
	registerCommand(Commands.BuildProject, buildProject);
	registerCommand(Commands.BuildProjectStrict, buildProjectStrict);
	registerCommand(Commands.RunSources, runSources);
	registerCommand(Commands.ShowOutput, showOutput);
	registerCommand(Commands.OpenIndex, openIndex);
	registerCommand(Commands.OpenEvidenceWalkthrough, openWalkthrough);
	registerCommand(Commands.CreateTemplatedPageFromQuery, createTemplatedPageFromQuery);
}

/**
 * Registers extension command.
 *
 * @param commandId Command id.
 * @param callback Command callback.
 * @param thisArg The `this` context used when invoking the handler function.
 */
function registerCommand(
	commandId: string,
	callback: (...args: any[]) => any,
	thisArg?: any
): void {
	const command: Disposable = commands.registerCommand(
		commandId,
		async (...args) => {
			try {
				await callback(...args);
			} catch (e: unknown) {
				window.showErrorMessage(String(e));
				console.error(e);
			}
		},
		thisArg
	);
	_context.subscriptions.push(command);
}
