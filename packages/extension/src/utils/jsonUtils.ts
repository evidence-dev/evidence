import { workspace, Uri } from 'vscode';

import { TextDecoder } from 'util';

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { getWorkspaceFolder } from '../config';

/**
 * Loads package.json configuration file content from the open workspace folder.
 *
 * @returns package.json file content, or udefined if package.json file doesn't exist.
 */
export async function loadPackageJson(): Promise<any | undefined> {
	const packageJsonFiles = await workspace.findFiles('**/package.json', '**/node_modules/**');

	if (packageJsonFiles.length > 0) {
		// Use the first package.json file found
		const packageJsonUri = packageJsonFiles[0];
		const packageJsonContent = await workspace.fs.readFile(packageJsonUri);
		const textDecoder = new TextDecoder('utf-8');
		const packageJson = JSON.parse(textDecoder.decode(packageJsonContent));
		return packageJson;
	}

	return undefined;
}

export async function getPackageJsonFolder(): Promise<string | undefined> {
	const packageJsonFiles = await workspace.findFiles('**/package.json', '**/node_modules/**');

	if (packageJsonFiles.length > 0) {
		// Get the workspace folder path
		const workspaceFolderPath = workspace.workspaceFolders
			? workspace.workspaceFolders[0].uri.fsPath
			: undefined;

		if (workspaceFolderPath) {
			for (const packageJsonUri of packageJsonFiles) {
				const packageJsonDirPath = path.dirname(packageJsonUri.fsPath);
				let relativePath = path.relative(workspaceFolderPath, packageJsonDirPath);

				// Remove leading slash for relative paths
				relativePath = relativePath.replace(/^\/|\\/, '');

				// Prioritize the package.json in the root
				if (relativePath === '') {
					return '';
				}
			}

			// If no root package.json, return the first one found
			const firstPackageJsonDirPath = path.dirname(packageJsonFiles[0].fsPath);
			let relativePath = path.relative(workspaceFolderPath, firstPackageJsonDirPath);
			relativePath = relativePath.replace(/^\/|\\/, '');
			return relativePath;
		}
	}

	return undefined;
}

/**
 * Checks loaded package.json configuration devDependencies
 * and dependencies for a dependency with the given name.
 *
 * @param packageJson Package json content.
 * @param dependencyName Dependency name to check.
 *
 * @returns True if dependency exists and false otherwise.
 */
export function hasDependency(packageJson: any, dependencyName: string): boolean {
	return Boolean(
		packageJson?.dependencies?.[dependencyName] || packageJson?.devDependencies?.[dependencyName]
	);
}

/**
 * Checks loaded package.json configuration devDependencies
 * and dependencies for a dependency with the given name.
 *
 * @param packageJson Package json content.
 * @param dependencyName Dependency name to check.
 *
 * @returns the version number of the package if it exists
 */
export function dependencyVersion(packageJson: any, dependencyName: string): string {
	return packageJson.dependencies[dependencyName];
}

export type Manifest = {
	renderedFiles: Record<string, string[]>;
};

function validateManifest(x: any): x is Manifest {
	return x &&
		typeof x === 'object' &&
		typeof x.renderedFiles === 'object' &&
		Object.keys(x.renderedFiles).length > 0
		? Object.values(x.renderedFiles).every(Array.isArray)
		: true;
}

export async function getManifestUri(): Promise<Uri> {
	const [manifestUri] = await workspace.findFiles(
		'**/.evidence/template/static/data/manifest.json',
		'**/node_modules/**',
		1
	);
	return manifestUri;
}

export async function getManifest(uri: Uri): Promise<Manifest | null> {
	const manifestJson = await workspace.fs.readFile(uri);
	const manifest = JSON.parse(Buffer.from(manifestJson).toString());
	if (validateManifest(manifest)) {
		return manifest;
	}
	return null;
}

export async function hasManifest() {
	const manifest = await workspace.findFiles(
		'**/.evidence/template/static/data/manifest.json',
		'**/node_modules/**'
	);
	return manifest.length > 0;
}

interface ConnectionConfig {
	type?: string;
}

export async function getTypesFromConnections() {
	const workspaceFolders = workspace.workspaceFolders;
	if (!workspaceFolders) {
		return []; // No workspace is opened
	}

	const packageJsonFolder = await getPackageJsonFolder();
	const sourcesPath = path.join(workspaceFolders[0].uri.fsPath, packageJsonFolder ?? '', 'sources');
	let types = [];

	try {
		const filesAndFolders = fs.readdirSync(sourcesPath);

		for (const item of filesAndFolders) {
			const itemPath = path.join(sourcesPath, item);
			if (fs.statSync(itemPath).isDirectory()) {
				const connectionFilePath = path.join(itemPath, 'connection.yaml');
				if (fs.existsSync(connectionFilePath)) {
					const fileContent = fs.readFileSync(connectionFilePath, 'utf8');
					try {
						const yamlContent = yaml.load(fileContent) as ConnectionConfig;
						if (yamlContent && yamlContent.type) {
							types.push(yamlContent.type);
						}
					} catch (err) {
						console.error(`Error parsing YAML in ${connectionFilePath}:`, err);
					}
				}
			}
		}

		return types;
	} catch (err) {
		console.error("Error reading 'sources' directory:", err);
		return []; // Return an empty array in case of error
	}
}
