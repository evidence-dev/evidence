import { vi, describe, it, expect } from 'vitest';

vi.mock('fs/promises');

import fs from 'fs/promises';
import {
	defaultConfig,
	handleAt,
	handleAtParsed,
	invalidMinimalConfig,
	validConfig,
	validConfigParsed,
	validMinimalConfig,
	validMinimalConfigParsed
} from './resolve-evidence-config.fixture';
import { loadConfig } from './resolve-evidence-config';

/** @type {import("vitest").MockedFunction<typeof import("fs/promises").readFile>} */
let mockedReadFile = /** @type {import("vitest").MockedFunction<typeof fs.readFile>} */ (
	fs.readFile
);

describe('loadConfig', () => {
	it('should load a valid configuration', async () => {
		mockedReadFile.mockResolvedValueOnce(validMinimalConfig);

		const config = await loadConfig(__dirname);

		expect(config).toEqual(validMinimalConfigParsed);
	});

	it('should properly escape @ symbols in keys when appropriate', async () => {
		mockedReadFile.mockResolvedValueOnce(handleAt);

		const config = await loadConfig(__dirname);

		expect(config).toEqual(handleAtParsed);
	});

	it('should load a verbose configuration', async () => {
		mockedReadFile.mockResolvedValueOnce(validConfig);

		const config = await loadConfig(__dirname);

		expect(config).toEqual(validConfigParsed);
	});

	it('should fail to load invalid configuration, but recover safely', async () => {
		mockedReadFile.mockResolvedValueOnce(invalidMinimalConfig);
		const config = loadConfig(__dirname);
		expect(config).rejects.toBeInstanceOf(Error);
	});

	it('should fail to load missing configuration, but recover safely', async () => {
		mockedReadFile.mockRejectedValueOnce(new Error('ENOENT'));
		const config = await loadConfig(__dirname);
		expect(config).toEqual({ components: defaultConfig, databases: {} });
	});
});
