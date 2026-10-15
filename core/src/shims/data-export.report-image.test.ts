// @vitest-environment jsdom
import ExcelJS from 'exceljs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryInfoContext } from '../query-info-context.svelte';
import { downloadPageDataAsExcel } from './data-export';

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

function queryInfoContextWith(entries: { title: string; rows: Record<string, unknown>[] }[]) {
	const queryInfoMap = new Map(
		entries.map((entry, i) => [
			`component-${i}`,
			{
				tag: 'table',
				title: entry.title,
				query: {
					loading: false,
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

// ExcelJS's typings omit `ext`, but it's populated when reading a one-cell-anchored image.
function imageExt(image: ReturnType<ExcelJS.Worksheet['getImages']>[number]) {
	return (image.range as unknown as { ext: { width: number; height: number } }).ext;
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

	async function loadDownloadedWorkbook(): Promise<ExcelJS.Workbook> {
		expect(downloadedBlobs).toHaveLength(1);
		// jsdom's Blob has no arrayBuffer().
		const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as ArrayBuffer);
			reader.onerror = () => reject(reader.error);
			reader.readAsArrayBuffer(downloadedBlobs[0]);
		});
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);
		return workbook;
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
		expect(workbook.worksheets.map((ws) => ws.name)).toEqual(['Revenue']);
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
		expect(workbook.worksheets.map((ws) => ws.name)).toEqual(['Report', 'Revenue']);

		const images = workbook.getWorksheet('Report')!.getImages();
		expect(images).toHaveLength(1);
		expect(images[0].range.tl.nativeCol).toBe(0);
		expect(images[0].range.tl.nativeRow).toBe(0);
		// Placed at CSS size (content + 10px padding each side) so the 2x PNG stays sharp.
		expect(imageExt(images[0])).toEqual({ width: 820, height: 1220 });

		const revenue = workbook.getWorksheet('Revenue')!;
		expect(revenue.getRow(2).values).toEqual([undefined, 'EMEA', 10]);
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
		expect(workbook.worksheets.map((ws) => ws.name)).toEqual(['Revenue']);
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
		expect(workbook.worksheets.map((ws) => ws.name)).toEqual(['Report']);
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
		expect(workbook.worksheets.map((ws) => ws.name)).toEqual(['Report', 'Revenue', 'Orders']);
		expect(workbook.getWorksheet('Revenue')!.getRow(2).values).toEqual([undefined, 'EMEA', 10]);
		expect(workbook.getWorksheet('Orders')!.getRow(2).values).toEqual([undefined, 'EMEA', 3]);
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
		expect(imageExt(workbook.getWorksheet('Report')!.getImages()[0])).toEqual({
			width: 1020,
			height: 520
		});
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
		expect(workbook.worksheets.map((ws) => ws.name)).toEqual(['Report', 'Report 2']);
	});
});
