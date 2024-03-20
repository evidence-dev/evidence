import { resolvePackageJSON, readPackageJSON, writePackageJSON } from 'pkg-types';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import chalk from 'chalk';

export const updatePackageJson = async () => {
	const packageJson = await readPackageJSON().catch(() => {
		throw new EvidenceError(
			'Could not find an package.json file',
			'Are you running this in a valid javascript package?'
		);
	});
	if (!packageJson.dependencies) packageJson.dependencies = {};

	// Install needed dependencies
	// TODO: How do we determine variables? (Can we literally steal from the SDK's package.json?)
	if (
		'@evidence-dev/sdk' in packageJson.dependencies ||
		'@evidence-dev/sdk' in (packageJson.devDependencies ?? {})
	) {
		console.debug(chalk.dim('Did not update @evidence-dev/sdk dependency, it already exists!'));
	} else {
		packageJson.dependencies['@evidence-dev/sdk'] = 'preview';
	}
	const packagePath = await resolvePackageJSON();
	await writePackageJSON(packagePath, packageJson);
};
