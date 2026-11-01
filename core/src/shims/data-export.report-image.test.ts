// @vitest-environment jsdom
import type { Workbook } from 'hucre';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryInfoContext } from '../query-info-context.svelte';
import { downloadPageDataAsExcel } from './data-export';
import { readWorkbook, readZipEntry } from '../test-utils/xlsx';
import type { ExcelFont } from './excel/font';
import type { ExcelSheet } from './excel/workbook';

const { toPngMock } = vi.hoisted(() => ({ toPngMock: vi.fn() }));

vi.mock('html-to-image', () => ({ toPng: toPngMock }));

vi.mock('svelte-sonner', () => ({
	toast: {
		loading: vi.fn(() => 'loading-toast'),
		dismiss: vi.fn(),
		success: vi.fn(),
		error: vi.fn()
	}
}));

const ONE_PX_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface TestQuery {
	title: string;
	rows: Record<string, unknown>[];
	loading?: boolean;
	buildExcelSheet?: (font: ExcelFont) => ExcelSheet;
}

function queryInfoContextWith(entries: TestQuery[]) {
	const queryInfoMap = new Map(
		entries.map((entry, i) => [
			`component-${i}`,
			{
				tag: 'table',
				title: entry.title,
				buildExcelSheet: entry.buildExcelSheet,
				query: {
					loading: entry.loading ?? false,
					result: {
						rows: entry.rows,
						columns: Object.keys(entry.rows[0]).map((name) => ({
							name,
							jsType: typeof entry.rows[0][name] === 'number' ? 'number' : 'string'
						}))
					}
				}
			}
		])
	);
	return { queryInfoMap } as unknown as QueryInfoContext;
}

function sheetNames(workbook: Workbook): string[] {
	return workbook.sheets.map((sheet) => sheet.name);
}

function getSheet(workbook: Workbook, name: string) {
	const sheet = workbook.sheets.find((s) => s.name === name);
	if (!sheet) throw new Error(`No sheet named ${name}`);
	return sheet;
}

function imageSize(workbook: Workbook) {
	const [image] = getSheet(workbook, 'Report').images ?? [];
	return { width: image?.width, height: image?.height };
}

describe('page Excel export report image', () => {
	let downloadedBlobs: Blob[];
	let clickSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		downloadedBlobs = [];
		toPngMock.mockReset();
		document.body.innerHTML = '';
		URL.createObjectURL = vi.fn((blob: Blob) => {
			downloadedBlobs.push(blob);
			return 'blob:test';
		});
		URL.revokeObjectURL = vi.fn();
		clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
	});

	afterEach(() => {
		clickSpy.mockRestore();
	});

	async function loadDownloadedWorkbook(): Promise<Workbook> {
		expect(downloadedBlobs).toHaveLength(1);
		// jsdom's Blob has no arrayBuffer().
		const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as ArrayBuffer);
			reader.onerror = () => reject(reader.error);
			reader.readAsArrayBuffer(downloadedBlobs[0]);
		});
		return readWorkbook(buffer);
	}

	function mountReport(width: number, height: number): HTMLElement {
		const target = document.createElement('div');
		target.setAttribute('data-markdoc-content', '');
		Object.defineProperty(target, 'getBoundingClientRect', {
			value: () => ({ width, height })
		});
		document.body.appendChild(target);
		return target;
	}

	it('exports data only and skips the capture unless includeImage is set', async () => {
		mountReport(800, 1200);
		toPngMock.mockResolvedValue(ONE_PX_PNG);

		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{ title: 'Revenue', rows: [{ region: 'EMEA', total: 10 }] }
			])
		});

		expect(toPngMock).not.toHaveBeenCalled();
		const workbook = await loadDownloadedWorkbook();
		expect(sheetNames(workbook)).toEqual(['Revenue']);
	});

	it('puts the captured page on a Report sheet ahead of the data sheets', async () => {
		mountReport(800, 1200);
		toPngMock.mockResolvedValue(ONE_PX_PNG);

		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{ title: 'Revenue', rows: [{ region: 'EMEA', total: 10 }] }
			]),
			includeImage: true
		});

		const workbook = await loadDownloadedWorkbook();
		expect(sheetNames(workbook)).toEqual(['Report', 'Revenue']);

		const images = getSheet(workbook, 'Report').images ?? [];
		expect(images).toHaveLength(1);
		expect(images[0].anchor.from).toMatchObject({ row: 0, col: 0 });
		// Placed at CSS size (content + 10px padding each side) so the 2x PNG stays sharp.
		expect(imageSize(workbook)).toEqual({ width: 820, height: 1220 });
		expect(getSheet(workbook, 'Report').view?.showGridLines).toBe(false);

		const revenue = getSheet(workbook, 'Revenue');
		expect(revenue.rows[1]).toEqual(['EMEA', 10]);
	});

	it('still exports the data sheets when the capture fails', async () => {
		mountReport(800, 1200);
		toPngMock.mockRejectedValue(new Error('canvas too large'));

		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{ title: 'Revenue', rows: [{ region: 'EMEA', total: 10 }] }
			]),
			includeImage: true
		});

		const workbook = await loadDownloadedWorkbook();
		expect(sheetNames(workbook)).toEqual(['Revenue']);
	});

	it('exports just the Report sheet for a page with no data, but errors without an image', async () => {
		mountReport(800, 1200);
		toPngMock.mockResolvedValue(ONE_PX_PNG);
		const onError = vi.fn();
		const emptyContext = { queryInfoMap: new Map() } as unknown as QueryInfoContext;

		await downloadPageDataAsExcel({ pageName: 'Notes', queryInfoContext: emptyContext, onError });
		expect(onError).toHaveBeenCalledWith('No queries found on this page', expect.any(String));
		expect(downloadedBlobs).toHaveLength(0);

		await downloadPageDataAsExcel({
			pageName: 'Notes',
			queryInfoContext: emptyContext,
			includeImage: true,
			onError
		});

		expect(onError).toHaveBeenCalledTimes(1);
		const workbook = await loadDownloadedWorkbook();
		expect(sheetNames(workbook)).toEqual(['Report']);
	});

	it('exports the results present when the download started, not ones changed during capture', async () => {
		mountReport(800, 1200);
		const queryInfoContext = queryInfoContextWith([
			{ title: 'Revenue', rows: [{ region: 'EMEA', total: 10 }] },
			{ title: 'Orders', rows: [{ region: 'EMEA', count: 3 }] }
		]);
		const revenue = queryInfoContext.queryInfoMap.get('component-0')!;
		const orders = queryInfoContext.queryInfoMap.get('component-1')!;

		// Simulate a filter change mid-capture: one query refetches with new rows, another is reloading.
		toPngMock.mockImplementation(async () => {
			(revenue.query as unknown as { result: unknown }).result = {
				rows: [{ region: 'APAC', total: 99 }],
				columns: [
					{ name: 'region', jsType: 'string' },
					{ name: 'total', jsType: 'number' }
				]
			};
			(orders.query as unknown as { loading: boolean }).loading = true;
			return ONE_PX_PNG;
		});

		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext,
			includeImage: true
		});

		const workbook = await loadDownloadedWorkbook();
		expect(sheetNames(workbook)).toEqual(['Report', 'Revenue', 'Orders']);
		expect(getSheet(workbook, 'Revenue').rows[1]).toEqual(['EMEA', 10]);
		expect(getSheet(workbook, 'Orders').rows[1]).toEqual(['EMEA', 3]);
	});

	it('captures only the element matching imageSelector', async () => {
		mountReport(300, 300);
		const pane = document.createElement('div');
		pane.className = 'editor-preview-pane';
		const main = document.createElement('div');
		main.setAttribute('data-markdoc-content', '');
		Object.defineProperty(main, 'getBoundingClientRect', {
			value: () => ({ width: 1000, height: 500 })
		});
		pane.appendChild(main);
		document.body.appendChild(pane);
		toPngMock.mockResolvedValue(ONE_PX_PNG);

		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{ title: 'Revenue', rows: [{ region: 'EMEA', total: 10 }] }
			]),
			includeImage: true,
			imageSelector: '.editor-preview-pane [data-markdoc-content]'
		});

		expect(toPngMock).toHaveBeenCalledWith(main, expect.anything());
		const workbook = await loadDownloadedWorkbook();
		expect(imageSize(workbook)).toEqual({ width: 1020, height: 520 });
	});

	it('renames a data sheet titled Report instead of colliding with the image sheet', async () => {
		mountReport(800, 1200);
		toPngMock.mockResolvedValue(ONE_PX_PNG);

		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{ title: 'Report', rows: [{ region: 'EMEA', total: 10 }] }
			]),
			includeImage: true
		});

		const workbook = await loadDownloadedWorkbook();
		expect(sheetNames(workbook)).toEqual(['Report', 'Report 2']);
	});
});

describe('page Excel export of styled tables', () => {
	let downloadedBlobs: Blob[];
	let clickSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		downloadedBlobs = [];
		toPngMock.mockReset();
		toPngMock.mockResolvedValue(ONE_PX_PNG);
		document.body.innerHTML = '<div data-markdoc-content></div>';
		URL.createObjectURL = vi.fn((blob: Blob) => {
			downloadedBlobs.push(blob);
			return 'blob:test';
		});
		URL.revokeObjectURL = vi.fn();
		clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
	});

	afterEach(() => {
		clickSpy.mockRestore();
	});

	async function downloadedBytes(): Promise<Uint8Array> {
		expect(downloadedBlobs).toHaveLength(1);
		const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as ArrayBuffer);
			reader.onerror = () => reject(reader.error);
			reader.readAsArrayBuffer(downloadedBlobs[0]);
		});
		return new Uint8Array(buffer);
	}

	const styled = (): ExcelSheet => ({ rows: [[{ value: 'Styled' }]] });
	const rows = [{ region: 'EMEA', total: 10 }];

	it.each([false, true])(
		'exports the styled sheet a table registers (image: %s)',
		async (includeImage) => {
			await downloadPageDataAsExcel({
				pageName: 'Sales',
				queryInfoContext: queryInfoContextWith([
					{ title: 'Revenue', rows, buildExcelSheet: styled }
				]),
				includeImage
			});

			const workbook = await readWorkbook(await downloadedBytes());
			expect(getSheet(workbook, 'Revenue').rows[0][0]).toBe('Styled');
		}
	);

	it('falls back to the raw results when the styled sheet fails to build', async () => {
		const onError = vi.fn();
		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{
					title: 'Revenue',
					rows,
					buildExcelSheet: () => {
						throw new Error('boom');
					}
				}
			]),
			onError
		});

		expect(onError).not.toHaveBeenCalled();
		const workbook = await readWorkbook(await downloadedBytes());
		expect(getSheet(workbook, 'Revenue').rows).toEqual([
			['Region', 'Total'],
			['EMEA', 10]
		]);
	});

	it('builds styled sheets once, before the capture, and only for exportable queries', async () => {
		const ready = vi.fn(styled);
		const loading = vi.fn(styled);
		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{ title: 'Revenue', rows, buildExcelSheet: ready },
				{ title: 'Pending', rows, loading: true, buildExcelSheet: loading }
			]),
			includeImage: true
		});

		expect(ready).toHaveBeenCalledTimes(1);
		expect(ready.mock.invocationCallOrder[0]).toBeLessThan(toPngMock.mock.invocationCallOrder[0]);
		expect(loading).not.toHaveBeenCalled();
	});

	it('points sparklines at their own sheet after duplicate titles are renamed', async () => {
		const withSparkline = (): ExcelSheet => ({
			rows: [[{ value: 'Trend' }, null, 1, 2, 3]],
			sparklines: [
				{ location: 'A1', dataRange: 'C1:E1' },
				{ location: 'B1', dataRange: "'Other'!C1:E1" }
			]
		});
		await downloadPageDataAsExcel({
			pageName: 'Sales',
			queryInfoContext: queryInfoContextWith([
				{ title: 'Sales', rows, buildExcelSheet: styled },
				{ title: 'Sales', rows, buildExcelSheet: withSparkline }
			])
		});

		const xml = readZipEntry(await downloadedBytes(), 'xl/worksheets/sheet2.xml');
		expect(xml).toContain("<xm:f>'Sales 2'!C1:E1</xm:f>");
		// A range that already names its sheet is left alone.
		expect(xml).toContain("<xm:f>'Other'!C1:E1</xm:f>");
	});
});
