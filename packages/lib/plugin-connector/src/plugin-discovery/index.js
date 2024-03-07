import { getRootModules } from './get-root-modules';
import { resolveEvidencePackages } from './resolve-evidence-config';

/**
 * @param {string} [rootDir]
 * @returns {Promise<PackageDiscoveryResult>}
 * @this {void}
 */
export async function discoverEvidencePlugins(rootDir) {
	if (!rootDir) rootDir = await getRootModules();

	return await resolveEvidencePackages(rootDir);
}
