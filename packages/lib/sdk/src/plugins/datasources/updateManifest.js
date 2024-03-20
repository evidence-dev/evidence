import fs from 'fs/promises';
import path from 'path';
/**
 * @param {import('./types.js').Manifest} updatedManifest
 * @param {string} dataDir
 * @param {import('./types.js').SourceFilters} filters
 */
export const updateManifest = async (updatedManifest, dataDir, filters) => {
	console.debug('Ran with filters', filters);
	await fs.mkdir(path.join(dataDir), { recursive: true });

	// TODO: Selectively apply new manifest based on filters
	// TODO: Decide if this should still be handled in evalSources (I don't think it should)
	await fs.writeFile(path.join(dataDir, 'manifest.json'), JSON.stringify(updatedManifest));
};
