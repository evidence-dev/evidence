import { getRootModules } from './get-root-modules';
import { resolveEvidencePackages } from './resolve-evidence-config';

/**
 * @returns {Promise<PackageDiscoveryResult>}
 * @this {void}
 */
export async function discoverEvidencePlugins() {
	// TODO: Make this pass-in-able
	const rootDir = await getRootModules();

	return await resolveEvidencePackages(rootDir);
}
