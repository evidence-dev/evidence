import { resetFs } from '../../lib/tests/fs.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

import { updateManifest } from './updateManifest.js';

describe('updateManifest', () => {
	beforeEach(() => {
		resetFs();
	});
	afterEach(() => {
		resetFs();
	});

	it('should write a manifest to disk when no manifest exists', async () => {
		const manifest = {
			renderedFiles: {
				csv: ['/_evidence/query/csv/data.parquet', '/_evidence/query/csv/nullish.parquet']
			},
			locatedFiles: {
				csv: ['data', 'nullish']
			}
		};

		const dataDir = '/_evidence';
		await updateManifest(manifest, dataDir);

		expect(await fs.stat(path.join(dataDir, 'manifest.json'))).toBeDefined();
		expect(await fs.readFile(path.join(dataDir, 'manifest.json'), 'utf8')).toEqual(
			JSON.stringify({ renderedFiles: manifest.renderedFiles })
		);
	});

	it('should remove queries that were not updated, but also were not located', async () => {
		const fsManifest = {
			renderedFiles: {
				csv: ['/_evidence/query/csv/data.parquet', '/_evidence/query/csv/nullish.parquet']
			}
		};
		const updatedManifest = {
			renderedFiles: {
				csv: ['/_evidence/query/csv/data.parquet']
			},
			locatedFiles: {
				csv: ['data']
			}
		};
		const dataDir = '/_evidence';
		await fs.mkdir(path.join(dataDir), { recursive: true });
		await fs.writeFile(
			path.join(dataDir, 'manifest.json'),
			JSON.stringify({ renderedFiles: fsManifest.renderedFiles })
		);
		await updateManifest(updatedManifest, dataDir);

		expect(await fs.stat(path.join(dataDir, 'manifest.json'))).toBeDefined();
		expect(await fs.readFile(path.join(dataDir, 'manifest.json'), 'utf8')).toEqual(
			JSON.stringify({ renderedFiles: updatedManifest.renderedFiles })
		);
	});

	it('should not remove queries that were not updated, but were located', async () => {
		const fsManifest = {
			renderedFiles: {
				csv: ['/_evidence/query/csv/data.parquet', '/_evidence/query/csv/nullish.parquet']
			}
		};
		const updatedManifest = {
			renderedFiles: fsManifest.renderedFiles,
			locatedFiles: {
				csv: ['data', 'nullish']
			}
		};
		const dataDir = '/_evidence';
		await fs.mkdir(path.join(dataDir), { recursive: true });
		await fs.writeFile(
			path.join(dataDir, 'manifest.json'),
			JSON.stringify({ renderedFiles: fsManifest.renderedFiles })
		);
		await updateManifest(updatedManifest, dataDir);

		expect(await fs.stat(path.join(dataDir, 'manifest.json'))).toBeDefined();
		expect(await fs.readFile(path.join(dataDir, 'manifest.json'), 'utf8')).toEqual(
			JSON.stringify(fsManifest)
		);
	});

	it('should not touch schemas that were not updated', async () => {
		const fsManifest = {
			renderedFiles: {
				csv: ['/_evidence/query/csv/data.parquet', '/_evidence/query/csv/nullish.parquet'],
				json: ['/_evidence/query/json/data.parquet']
			}
		};
		const updatedManifest = {
			renderedFiles: {
				csv: ['/_evidence/query/csv/data.parquet']
			},
			locatedFiles: {
				csv: ['data', 'nullish']
			}
		};
		const dataDir = '/_evidence';
		await fs.mkdir(path.join(dataDir), { recursive: true });
		await fs.writeFile(
			path.join(dataDir, 'manifest.json'),
			JSON.stringify({ renderedFiles: fsManifest.renderedFiles })
		);
		await updateManifest(updatedManifest, dataDir);

		expect(await fs.stat(path.join(dataDir, 'manifest.json'))).toBeDefined();
		expect(await fs.readFile(path.join(dataDir, 'manifest.json'), 'utf8')).toEqual(
			JSON.stringify(fsManifest)
		);
	});

	it('should prefer the updated path for a query', async () => {
		const fsManifest = {
			renderedFiles: {
				csv: ['/_evidence/query/csv/data.parquet', '/_evidence/query/csv/nullish.parquet']
			}
		};
		const updatedManifest = {
			renderedFiles: {
				csv: ['/__evidence/query/csv/data.parquet', '/__evidence/query/csv/nullish.parquet']
			},
			locatedFiles: {
				csv: ['data', 'nullish']
			}
		};
		const dataDir = '/_evidence';
		await fs.mkdir(path.join(dataDir), { recursive: true });
		await fs.writeFile(
			path.join(dataDir, 'manifest.json'),
			JSON.stringify({ renderedFiles: fsManifest.renderedFiles })
		);
		await updateManifest(updatedManifest, dataDir);
		expect(await fs.readFile(path.join(dataDir, 'manifest.json'), 'utf8')).toEqual(
			JSON.stringify({
				renderedFiles: updatedManifest.renderedFiles
			})
		)
	})
});
