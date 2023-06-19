import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';
import { isValidPackage } from '../plugin-discovery/is-valid-package';
import { manifestLoader } from './loaders/manifest-loader';
import { fileLoader } from './loaders/file-loader';

/**
 * Loads components from a package, given a root directory, package name, and configuration.
 *
 * @param {string} rootDir - The root directory for the package.
 * @param {string} packagePath
 * @param {EvidenceComponentConfig} config
 * @return {Promise<Set<string>>} An array containing the package name and a set of component names.
 */
export const getComponentsForPackage = async (rootDir, packagePath, config) => {
	const validEvidencePackage = await isValidPackage(packagePath);

	/** @type {Set<string>} */
	const providedComponents = new Set();

	// This doesn't have the required metadata
	if (!validEvidencePackage) return providedComponents;

	// This is a database connector, not a component lib
	if (validEvidencePackage.evidence && !validEvidencePackage.evidence.components) {
		console.warn(
			chalk.yellow(
				`[!] ${validEvidencePackage.name} is being used as a component plugin, but does not contain components.`
			)
		);
		return providedComponents;
	}

	if (config.provides.length) {
		// Use this value as the first truth
		config.provides.forEach((c) => providedComponents.add(c));
	} else if (!validEvidencePackage.evidence) {
		// This is probably an external component library that doesn't have any provides statements
		console.warn(
			chalk.yellow(
				`[!] ${validEvidencePackage.name} is being used as a component plugin, but does not contain plugins. You may need to add a provides statement to your manifest.`
			)
		);
		return providedComponents;
	} else {
		const manifestPath = path.resolve(packagePath, 'evidence.manifest.yaml');
		const manifestExists = await fs
			.access(manifestPath)
			.then(() => true)
			.catch(() => false);

		if (manifestExists) {
			// Use manifest
			const manifestComponents = await manifestLoader(packagePath, rootDir);
			manifestComponents.forEach((c) => providedComponents.add(c));
		} else {
			// Use file discovery

			// Attempt to extract the folder that contains built assets
			const mainFilePath = path.parse(
				'main' in validEvidencePackage
					? path.resolve(packagePath, validEvidencePackage.main)
					: 'svelte' in validEvidencePackage
					? path.resolve(packagePath, validEvidencePackage.svelte)
					: path.resolve(packagePath, validEvidencePackage.exports['.'])
			).dir;

			const fileComponents = await fileLoader(mainFilePath);
			fileComponents.forEach((c) => providedComponents.add(c));
		}
	}

	return providedComponents;
};
