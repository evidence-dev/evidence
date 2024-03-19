import fs from 'fs';
import path from 'path';

const inTemplate = process.cwd().includes(path.join('.evidence', 'template'));
const evidenceDirectory = inTemplate ? '..' : '.evidence';
const dataDirectory = path.resolve(evidenceDirectory, 'data');

/**
 * @param {"browser" | "node"} [dest = "node"]
 */
export const getManifest = (dest = 'node') => {
	// TODO: Does this need to be sync? Would simplify types if not
	try {
		const manifestContent = fs.readFileSync(path.join(dataDirectory, 'manifest.json'), 'utf-8');
		/** @type {import('../../../../plugins/datasources/types.js').Manifest} */
		const manifest = JSON.parse(manifestContent);

		if (!manifest.renderedFiles) throw new Error('Malformed Manifest');

		if (dest === 'node') {
			const renderedFiles = Object.fromEntries(
				Object.entries(manifest.renderedFiles).map(([schema, queries]) => {
					return [
						schema,
						queries.map((queryPath) => {
							// Don't modify external paths
							if (queryPath.startsWith('http')) return queryPath;
							// Adjust prefix
							queryPath = queryPath.replace(
								'_evidence/query',
								path.join(evidenceDirectory, 'data')
							);
							const filename = queryPath.match(/(.+\/)(.+).parquet/);
							if (filename?.length !== 3) {
								// TODO: Debug log?
								return queryPath;
							} else {
								return `${queryPath.startsWith('/') ? '.' : './'}${filename[1]}${filename[2]}/${
									filename[2]
								}.parquet`;
							}
						})
					];
				})
			);
			manifest.renderedFiles = renderedFiles;
		}

		return JSON.stringify(manifest);
	} catch (e) {
		console.warn('Failed to load manifest file ||  ', e instanceof Error ? e.message : e);
		return JSON.stringify({
			renderedFiles: {}
		});
	}
};
