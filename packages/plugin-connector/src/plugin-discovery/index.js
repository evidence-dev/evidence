import chalk from "chalk";
import { discoverEvidencePackages } from "./discover-evidence-packages";
import { getRootModules } from "./get-root-modules";

/**
 * @returns {Promise<EvidencePluginDiscoveryResult>}
 * @this {void}
 */
export async function discoverEvidencePlugins() {
    /** @type {EvidencePluginDiscoveryResult} */
    const output = {
        components: [],
        databases: []
    }

    const rootDir = await getRootModules();
    // TODO: This will get swapped with configuration methodology
    const evidencePackages = await discoverEvidencePackages(rootDir);

    for (const evidencePackage of evidencePackages) {
        if (!evidencePackage.package.main) {
            console.warn(
              chalk.yellow(
                `[!] Not loading ${evidencePackage.package.name} as a plugin; please inform the plugin author of this error. (package.json missing \`main\` field.)`
              )
            );
            continue;
        }
    
        const packagePath = `${rootDir}/node_modules/${evidencePackage.path}`
        if (evidencePackage.package.evidence.components) {
            // TODO: Build component information here?
            output.components.push(evidencePackage)
        }
        if (evidencePackage.package.evidence.databases) {
            output.databases.push(evidencePackage)
        }
    }

    return output;
}