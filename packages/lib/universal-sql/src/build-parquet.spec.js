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
			'out.parquet'
		);
		expect(r).toBe(0);
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
			'out.parquet'
		);
		expect(r).toBe(2);
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledOnce();
		// verify the rm call targeted the intermediate directory and a tempfile
		const calledPath = fs.rm.mock.calls[0][0];
		expect(path.dirname(calledPath)).toBe(
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet')
		);
		// basename should look like out.<timestamp>.<rand>.0.parquet
		expect(path.basename(calledPath)).toMatch(/^out\.\d+\.[0-9a-z]{6}\.0\.parquet$/);
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
			'out.parquet',
			1
		);
		expect(r).toBe(2);
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledTimes(2);
		const calledPath1 = fs.rm.mock.calls[0][0];
		const calledPath2 = fs.rm.mock.calls[1][0];
		expect(path.dirname(calledPath1)).toBe(
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet')
		);
		expect(path.dirname(calledPath2)).toBe(
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet')
		);
		expect(path.basename(calledPath1)).toMatch(/^out\.\d+\.[0-9a-z]{6}\.0\.parquet$/);
		expect(path.basename(calledPath2)).toMatch(/^out\.\d+\.[0-9a-z]{6}\.1\.parquet$/);
	});

	it('should accept an array as the data argument', async () => {
		const mockCols = [{ name: 'x', evidenceType: 'string' }];

		const r = await buildMultipartParquet(
			mockCols,
			[{ x: 'hello' }, { x: 'hello' }],
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet'),
			adaptFilePath('.evidence/template/static/data'),
			'out.parquet'
		);
		expect(r).toBe(2);
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledOnce();
		const calledPathA = fs.rm.mock.calls[0][0];
		expect(path.dirname(calledPathA)).toBe(
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet')
		);
		expect(path.basename(calledPathA)).toMatch(/^out\.\d+\.[0-9a-z]{6}\.0\.parquet$/);
	});

	it('should handle a very large number of batches', async () => {
		const mockCols = [{ name: 'x', evidenceType: 'string' }];

		const VERY_LARGE_NUMBER = 800;

		function* gen() {
			for (let i = 0; i < VERY_LARGE_NUMBER; i++) yield [{ x: i }];
		}

		const r = await buildMultipartParquet(
			mockCols,
			gen(),
			adaptFilePath('.evidence/template/.evidence-queries/intermediate-parquet'),
			adaptFilePath('.evidence/template/static/data'),
			'out.parquet',
			1
		);
		expect(r).toBe(VERY_LARGE_NUMBER);
		const stat = await fs.stat('.evidence/template/static/data/out.parquet');
		expect(stat.isFile()).toBeTruthy();
		// Make sure it contains data
		expect(stat.size).toBeGreaterThan(0);
		expect(fs.rm).toHaveBeenCalledTimes(VERY_LARGE_NUMBER);
	});

	// TODO: Test how it handles invalid filepath
	// TODO: Test how it handles missing column data
	// TODO: Test how it handles data that includes more keys than are in columns
});
