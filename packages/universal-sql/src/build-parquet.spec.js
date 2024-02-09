import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildMultipartParquet } from './build-parquet';

import mockfs from 'mock-fs';
import fs from 'fs/promises';
import { initDB } from './client-duckdb/node';
import path from 'path';

function adaptFilePath(filepath) {
	return path.join(...filepath.split('/'));
}

// Spying on writeFile breaks things; but we can listen for the cleanup.
vi.spyOn(fs, 'rm');

describe('buildMultipartParquet', () => {
	beforeEach(async () => {
		vi.resetAllMocks();
		await initDB();
		mockfs({
			sources: {},
			static: {
				data: {}
			}
		});
	});

	it('should be defined', () => expect(buildMultipartParquet).toBeDefined());
	it('should handle a generator that returns no results correctly', async () => {
		const mockCols = [
			{
				name: 'x',
				evidenceType: 'string'
			}
		];

		function* emptyGenerator() {
			yield [];
			return [];
		}
		const r = await buildMultipartParquet(
			mockCols,
			emptyGenerator(),
			adaptFilePath('./.evidence/template'),
			adaptFilePath(''),
			'out'
		);
		expect(r).toEqual({ writtenRows: 0, filenames: [] });
	});

	it('should write one temporary file when given fewer than one batch of rows', async () => {
		const mockCols = [
			{
				name: 'x',
				evidenceType: 'string'
			}
		];
		function* gen() {
			yield [{ x: 'hello' }];
			yield [{ x: 'world' }];
		}

		const r = await buildMultipartParquet(
			mockCols,
			gen(),
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet'),
			adaptFilePath('.evidence/template/static/data'),
			'out'
		);
		expect(r).toEqual({ writtenRows: 2, filenames: ['out.parquet'] });
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledOnce();
		expect(fs.rm).toHaveBeenCalledWith(
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet/out.0.parquet'),
			{ force: true }
		);
	});

	it('should write two temporary files when given enough rows for two batches', async () => {
		const mockCols = [
			{
				name: 'x',
				evidenceType: 'string'
			}
		];
		function* gen() {
			yield [{ x: 'hello' }];
			yield [{ x: 'world' }];
		}

		const r = await buildMultipartParquet(
			mockCols,
			gen(),
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet'),
			adaptFilePath('.evidence/template/static/data'),
			'out',
			2,
			1
		);
		expect(r).toEqual({ writtenRows: 2, filenames: ['out.parquet'] });
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledTimes(2);
		expect(fs.rm).toHaveBeenNthCalledWith(
			1,
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet/out.0.parquet'),
			{ force: true }
		);
		expect(fs.rm).toHaveBeenNthCalledWith(
			2,
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet/out.1.parquet'),
			{ force: true }
		);
	});

	it('should accept an array as the data argument', async () => {
		const mockCols = [{ name: 'x', evidenceType: 'string' }];

		const r = await buildMultipartParquet(
			mockCols,
			[{ x: 'hello' }, { x: 'hello' }],
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet'),
			adaptFilePath('.evidence/template/static/data'),
			'out'
		);
		expect(r).toEqual({ writtenRows: 2, filenames: ['out.parquet'] });
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledOnce();
		expect(fs.rm).toHaveBeenCalledWith(
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet/out.0.parquet'),
			{
				force: true
			}
		);
	});

	it('should handle a very large number of batches', async () => {
		const mockCols = [{ name: 'x', evidenceType: 'string' }];

		function* gen() {
			for (let i = 0; i < 1000; i++) yield [{ x: i }];
		}

		const r = await buildMultipartParquet(
			mockCols,
			gen(),
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet'),
			adaptFilePath('.evidence/template/static/data'),
			'out',
			1000,
			1
		);
		expect(r).toEqual({ writtenRows: 1000, filenames: ['out.parquet'] });
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledTimes(1000);
	});

	// TODO: Test how it handles invalid filepath
	// TODO: Test how it handles missing column data
	// TODO: Test how it handles data that includes more keys than are in columns
});
