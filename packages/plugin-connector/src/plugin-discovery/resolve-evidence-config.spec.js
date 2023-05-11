import { vi, describe, it, expect } from 'vitest';
vi.mock('fs/promises');

import fs from 'fs/promises';
import {
    handleAt,
	handleAtParsed,
	invalidMinimalConfig,
	validConfig,
	validConfigParsed,
	validMinimalConfig,
	validMinimalConfigParsed
} from './resolve-evidence-config.fixture';
import { loadConfig } from './resolve-evidence-config';
import chalk from 'chalk';

/** @type {import("vitest").MockedFunction<typeof import("fs/promises").readFile>} */
let mockedReadFile = /** @type {import("vitest").MockedFunction<typeof fs.readFile>} */ (
	fs.readFile
);

describe('loadConfig', () => {
	it('should load a valid configuration', () => {
		mockedReadFile.mockResolvedValueOnce(validMinimalConfig);

		const config = loadConfig(__dirname);

		expect(config).resolves.toEqual(validMinimalConfigParsed);
	});

	it('should properly escape @ symbols in keys when appropriate', () => {
		mockedReadFile.mockResolvedValueOnce(handleAt);

		const config = loadConfig(__dirname);

		expect(config).resolves.toEqual(handleAtParsed);

    });

	it('should load a verbose configuration', () => {
		mockedReadFile.mockResolvedValueOnce(validConfig);

		const config = loadConfig(__dirname);

		expect(config).resolves.toEqual(validConfigParsed);
	});

    it('should fail to load invalid configuration, but recover safely', () => {
        mockedReadFile.mockResolvedValueOnce(invalidMinimalConfig);
		const config = loadConfig(__dirname);
        expect(config).resolves.toEqual({components: {}})
    })

    it('should fail to load missing configuration, but recover safely', () => {
        mockedReadFile.mockRejectedValueOnce(new Error('ENOENT'));
		const config = loadConfig(__dirname);
        expect(config).resolves.toEqual({components: {}})
    })
});
