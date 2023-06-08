import chalk from 'chalk';
import { ValidPackageSchema } from './schemas/evidence-package.schema';
import fs from 'fs/promises';
/**
 * Checks a directory to see if it is a package
 * and if it is a package, if it includes
 * the evidence block that marks it as a plugin
 * @param {string} path
 * @returns {Promise<false | ValidPackage>}
 */
export const isValidPackage = async (path) => {
	try {
		const s = await fs.stat(path);
		if (!s.isDirectory()) return false;
	} catch (e) {
		if (e instanceof Error && /** @type{NodeJS.ErrnoException} */ (e).code !== 'ENOENT') {
			console.warn(
				chalk.yellow(
					`[!] An error occured while loading ${chalk.bold(
						`"${path.split('node_modules/')[1]}"`
					)}: ${e}.`
				)
			);
		} else {
			console.warn(
				chalk.yellow(
					`[!] ${chalk.bold(
						`"${path.split('node_modules/')[1]}"`
					)} could not be found in your node_modules. Check for spelling errors or try running npm install.`
				)
			);
		}
		return false;
	}

	const c = await fs.readdir(path);
	if (!c.includes('package.json')) return false;

	const packageContent = await fs.readFile(`${path}/package.json`).then(
		/** @param {Buffer} fileContent */
		(fileContent) => JSON.parse(fileContent.toString())
	);
	const zodResult = ValidPackageSchema.safeParse(packageContent);
	if (zodResult.success) return zodResult.data;
	else {
		console.warn(
			chalk.yellow(
				`[!] ${chalk.bold(
					`"${path.split('node_modules/')[1]}"`
				)} could not be loaded as a plugin, it is missing a name or main field.`
			)
		);
		return false;
	}
};
