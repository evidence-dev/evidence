import { readXlsx, type Sheet, type Workbook } from 'hucre';
import { inflateRaw } from 'pako';
import { writeWorkbook, type ExcelSheet } from '../shims/excel/workbook';
import { CALIBRI_11 } from '../shims/excel/font';

/** Writes `sheet` to an .xlsx and reads it back with styles, as Excel would see it. */
export async function roundTripSheet(sheet: ExcelSheet, name = 'Data'): Promise<Sheet> {
	const workbook = await readXlsx(await writeWorkbook([{ ...sheet, name }], CALIBRI_11), {
		readStyles: true
	});
	return workbook.sheets[0];
}

export async function readWorkbook(bytes: Uint8Array | ArrayBuffer): Promise<Workbook> {
	return readXlsx(bytes, { readStyles: true });
}

/** The cell at 0-based `row`/`col`, with its style. */
export function cellAt(sheet: Sheet, row: number, col: number) {
	return sheet.cells?.get(`${row},${col}`);
}

/** Reads one part (e.g. `xl/worksheets/sheet1.xml`) out of an .xlsx, for asserting on raw XML. */
export function readZipEntry(bytes: Uint8Array, path: string): string {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let offset = 0;
	while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
		const method = view.getUint16(offset + 8, true);
		const compressedSize = view.getUint32(offset + 18, true);
		const nameLength = view.getUint16(offset + 26, true);
		const extraLength = view.getUint16(offset + 28, true);
		const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
		const dataStart = offset + 30 + nameLength + extraLength;
		const data = bytes.subarray(dataStart, dataStart + compressedSize);
		if (name === path) {
			return new TextDecoder().decode(method === 0 ? data : inflateRaw(data));
		}
		offset = dataStart + compressedSize;
	}
	throw new Error(`${path} not found in workbook`);
}
