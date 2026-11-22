import type { CellValue } from 'hucre';
import {
	convertSingleQuotesToDouble,
	FORMAT_PRESETS,
	formatValue,
	isDateFormat,
	isTemporalColumnType,
	resolveFormatCode,
	type LocalizedFormatValue,
	standardizeDateString
} from '../../user-components/formatValue';
import { isValidExcelNumFmt } from './num-fmt';

export interface ExcelCellOptions {
	/** Evidence format: a preset (`usd1m`), an auto format (`usd`), a custom code, or `General`. */
	fmt?: string;
	columnType?: string;
	/** Column min/max, so auto formats pick the same unit and decimals as on screen. */
	range?: { min: number; max: number };
	firstDayOfWeek?: 'sunday' | 'monday';
	formatValue?: LocalizedFormatValue;
}

export interface ExcelCellContent {
	value: CellValue;
	numFmt?: string;
	/** Lazy for numbers: column sizing usually formats only each column's widest value. */
	readonly text: string;
}

function numberCell(
	value: number,
	numFmt: string | undefined,
	format: () => string
): ExcelCellContent {
	let text: string | undefined;
	return {
		value,
		...(numFmt ? { numFmt } : {}),
		get text() {
			return (text ??= format());
		}
	};
}

/** Null for quarters, which `formatValue` builds by hand. */
function resolveExcelFormat(code: string): { numFmt: string; isDate: boolean } | null {
	if (code === 'quarter' || code === 'qq') return null;
	const numFmt = convertSingleQuotesToDouble(
		FORMAT_PRESETS[code as keyof typeof FORMAT_PRESETS] ?? code
	);
	if (!isValidExcelNumFmt(numFmt)) return { numFmt: 'General', isDate: false };
	// Quoted text can't be a date token: `0.0" s"` is seconds, not a seconds field.
	const unquoted = numFmt.replace(/"[^"]*"/g, '');
	// `mdy`/`dmy` expand to `m/d/y`, which the pattern check doesn't see as a date.
	const isDatePreset = code in FORMAT_PRESETS && isDateFormat(code);
	return { numFmt, isDate: isDatePreset || (unquoted !== '' && isDateFormat(unquoted)) };
}

function toJson(value: unknown): string {
	return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}

/** Null for quarters and date formats on date parts (a 1–7 day of week): those export as text. */
export function excelNumberFormat(
	fmt: string,
	value: number,
	range?: { min: number; max: number }
): string | null {
	const format = resolveExcelFormat(resolveFormatCode(fmt, value, range));
	return format && !format.isDate ? format.numFmt : null;
}

// hucre writes a Date's UTC fields, so rebuild it from the local fields the report displays.
function toExcelDate(value: unknown): Date | null {
	let date: Date;
	if (value instanceof Date) {
		date = value;
	} else if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
		date = new Date(standardizeDateString(value));
	} else {
		return null;
	}
	// Excel's calendar starts in 1900.
	if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return null;
	return new Date(
		Date.UTC(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
			date.getMilliseconds()
		)
	);
}

/** Numbers and dates stay native; anything Excel can't format natively becomes the report's text. */
export function toExcelCell(rawValue: unknown, options: ExcelCellOptions = {}): ExcelCellContent {
	const { fmt, columnType, range, firstDayOfWeek, formatValue: formatText = formatValue } = options;
	let value = rawValue;

	if (value === null || value === undefined) return { value: null, text: '' };
	if (typeof value === 'bigint') {
		// Excel numbers are doubles; a bigger integer (a 64-bit ID, say) stays exact as text.
		if (!Number.isSafeInteger(Number(value)))
			return { value: value.toString(), text: value.toString() };
		value = Number(value);
	}
	if (typeof value === 'boolean') return { value, text: value ? 'TRUE' : 'FALSE' };
	if (typeof value === 'object' && !(value instanceof Date)) {
		const json = toJson(value);
		return { value: json, text: json };
	}
	// Some warehouses (e.g. ClickHouse decimals) return numbers as strings.
	if (columnType === 'number' && typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (!Number.isNaN(parsed)) value = parsed;
	}
	// Unformatted exports keep non-numbers (an "N/A" in a number column) exactly as returned.
	if (fmt === 'General') {
		return typeof value === 'number'
			? numberCell(value, 'General', () => String(value))
			: { value: value instanceof Date ? value.toISOString() : String(value), text: String(value) };
	}

	const format = () => formatText(value, fmt, String(value), range, columnType, firstDayOfWeek);
	const effectiveFmt =
		fmt ??
		(isTemporalColumnType(columnType) ? 'date' : typeof value === 'number' ? 'num' : undefined);

	if (typeof value === 'number') {
		const numFmt =
			effectiveFmt && Number.isFinite(value)
				? excelNumberFormat(effectiveFmt, value, range)
				: undefined;
		if (numFmt === null || !Number.isFinite(value)) {
			const text = format();
			return { value: text === '' ? null : text, text };
		}
		return numberCell(value, numFmt, format);
	}

	const text = format();

	if (
		effectiveFmt &&
		(value instanceof Date || isTemporalColumnType(columnType) || isDateFormat(effectiveFmt))
	) {
		const format = resolveExcelFormat(effectiveFmt);
		const date = format?.isDate ? toExcelDate(value) : null;
		if (date && format) return { value: date, numFmt: format.numFmt, text };
	}

	return { value: text, text };
}
