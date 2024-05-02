import { workspace, FileType, OutputChannel, WorkspaceFolder, Uri } from 'vscode';

import { getWorkspaceFolder } from '../config';
import { getOutputChannel } from '../output';

import * as fs from 'fs';
import * as path from 'path';

/**
 * Checks if the given folder exists using workspace.fs API.
 *
 * @param folder Folder Uri.
 */
export async function folderExists(folder: Uri): Promise<boolean> {
	try {
		const fileStat = await workspace.fs.stat(folder);
		if (fileStat.type === FileType.Directory) {
			return true;
		}
	} catch (error) {
		return false;
	}
	return false;
}

/**
 * Copies template folder to the destination folder.
 *
 * @param templateFolder Template folder Uri.
 * @param destinationFolder Destination folder Uri.
 */
export async function copyFolder(templateFolder: Uri, destinationFolder: Uri): Promise<boolean> {
	// display folder copy progress in the output channel
	const outputChannel: OutputChannel = getOutputChannel();
	outputChannel.show();
	outputChannel.appendLine('\nCreating project from template ...');
	outputChannel.appendLine(`- Template Project: ${templateFolder.fsPath}\n`);

	try {
		// get open workspace folder
		const workspaceFolder: WorkspaceFolder | undefined = await getWorkspaceFolder();

		if (workspaceFolder && workspaceFolder.uri.fsPath === destinationFolder.fsPath) {
			// copy source folder files and subfolders into the open workspace folder
			const filesCopied = await copyFiles(templateFolder, workspaceFolder.uri);
			if (filesCopied) {
				outputChannel.appendLine(
					`✔ New project created successfully in the open workspace folder: ${workspaceFolder.name}`
				);
				return true;
			}
			return false; // folder copy into open workspace folder failed
		} else {
			// copy template folder to the destination folder with overwrite option
			await workspace.fs.copy(templateFolder, destinationFolder, { overwrite: true });
			outputChannel.appendLine(`✔ New project created successfully.`);
			return true;
		}
	} catch (error) {
		outputChannel.appendLine('✗ Error copying template project:');
		outputChannel.appendLine(` ${error}`);
		return false;
	}
}

/**
 * Creates new target folder, if it doesn't exist,
 * and copies all the files and subfolders
 * from the source folder to the target folder.
 *
 * @param sourceFolder The source folder Uri.
 * @param targetFolder The target folder Uri.
 */
export async function copyFiles(sourceFolder: Uri, targetFolder: Uri) {
	// get source folder files and subfolders
	const sourceFiles = await workspace.fs.readDirectory(sourceFolder);

	// create target folder if it doesn't exist
	if (!(await folderExists(targetFolder))) {
		await workspace.fs.createDirectory(targetFolder);
	}

	// copy files and subfolders from the source to the target folder
	for (const [name, type] of sourceFiles) {
		// create source and file target Uris
		const sourceFile: Uri = Uri.joinPath(sourceFolder, name);
		const targetFile: Uri = Uri.joinPath(targetFolder, name);

		if (type === FileType.File) {
			// copy file
			await workspace.fs.copy(sourceFile, targetFile);
		} else if (type === FileType.Directory) {
			// create new target subfolder
			await workspace.fs.createDirectory(targetFile);

			// copy source subfolder to target folder
			await workspace.fs.copy(sourceFile, targetFile, { overwrite: true });
		}
	}

	return true;
}

/**
 * Deletes a folder from the open project workspace
 * ussing workspace.fs API.
 *
 * @param relativeFolderPath Relative folder path to delete.
 * @returns True if the folder is deleted, and false otherwise.
 */
export async function deleteFolder(relativeFolderPath: string): Promise<boolean> {
	const workspaceFolders = workspace.workspaceFolders;

	if (workspaceFolders) {
		for (const folder of workspaceFolders) {
			const folderUri: Uri = Uri.joinPath(folder.uri, relativeFolderPath);
			if (await folderExists(folderUri)) {
				try {
					await workspace.fs.delete(folderUri, { recursive: true });
					return true;
				} catch (error) {
					return false;
				}
			}
		}
	}
	return false;
}

/**
 * Deletes a file from the project workspace.
 *
 * @param relativeFilePath Relative file path to delete.
 * @returns True if the file is deleted, and false otherwise.
 */
export async function deleteFile(relativeFilePath: string): Promise<boolean> {
	const workspaceFolders = workspace.workspaceFolders;
	if (workspaceFolders) {
		for (const folder of workspaceFolders) {
			const fileUri: Uri = Uri.joinPath(folder.uri, relativeFilePath);
			try {
				const fileStat = await workspace.fs.stat(fileUri);
				if (fileStat.type === FileType.File) {
					await workspace.fs.delete(fileUri);
					return true;
				}
			} catch (error) {}
		}
	}
	return false;
}

export function countFilesInDirectory(dir: string, filePattern: RegExp): number {
	let count: number = 0;

	if (!fs.existsSync(dir)) {
		return count;
	}

	const files: string[] = fs.readdirSync(dir);

	for (const file of files) {
		const fullPath: string = path.join(dir, file);
		const stat: fs.Stats = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			count += countFilesInDirectory(fullPath, filePattern);
		} else if (filePattern.test(file)) {
			count++;
		}
	}

	return count;
}

export function countTemplatedPages(dir: string): number {
	let count: number = 0;

	if (!fs.existsSync(dir)) {
		return count;
	}

	const files: string[] = fs.readdirSync(dir);

	for (const file of files) {
		const fullPath: string = path.join(dir, file);
		const stat: fs.Stats = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			if (/\[.*\]/.test(file) && fs.existsSync(path.join(fullPath, 'index.md'))) {
				count++;
			}
			count += countTemplatedPages(fullPath);
		} else if (/\[.*\]\.md$/.test(file)) {
			count++;
		}
	}

	return count;
}
