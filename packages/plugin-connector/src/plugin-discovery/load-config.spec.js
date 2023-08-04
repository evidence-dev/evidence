import { vi, describe, it, expect } from 'vitest';

vi.mock('fs/promises');
vi.mock('fs');

import fs from 'fs/promises';
import fsLegacy from 'fs';
import {
	defaultConfig,
	handleAt,
	handleAtParsed,
	invalidMinimalConfig,
	validConfig,
	validConfigParsed,
	validMinimalConfig,
	validMinimalConfigParsed
} from './load-config.fixture';
import { loadConfig } from './load-config';

fs.readFile = /** @type {any} */ (vi.fn());
const mockedReadFile = vi.mocked(fs.readFile);
fsLegacy.readFileSync = /** @type {any} */ (vi.fn());
const mockedReadFileSync = vi.mocked(fsLegacy.readFileSync);

describe('loadConfig', () => {
	it('should load a valid configuration', async () => {
		mockedReadFileSync.mockImplementationOnce(()=>{console.trace("Hi"); return validMinimalConfig});

		const config = loadConfig(__dirname);

		expect(config).toEqual(validMinimalConfigParsed);
	});

	it('should properly escape @ symbols in keys when appropriate', async () => {
		mockedReadFileSync.mockReturnValueOnce(handleAt);

		const config = loadConfig(__dirname);

		expect(config).toEqual(handleAtParsed);
	});

	it('should load a verbose configuration', async () => {
		mockedReadFileSync.mockReturnValueOnce(validConfig);

		const config = loadConfig(__dirname);

		expect(config).toEqual(validConfigParsed);
	});

	it('should fail to load invalid configuration', async () => {
		mockedReadFileSync.mockReturnValueOnce(invalidMinimalConfig);
		expect(() => loadConfig(__dirname)).toThrowError();
	});

	it('should fail to load missing configuration', async () => {
		mockedReadFileSync.mockImplementationOnce(() => {throw new Error('ENOENT')});
		expect(() => loadConfig(__dirname)).toThrowError();
	});
});
