/** Widths are only right when measured in the font the workbook declares, so both share this. */
export interface ExcelFont {
	readonly name: string;
	/** Size in points. */
	readonly size: number;
	/** Height of one line of text in points: Excel's default row height for this font. */
	readonly lineHeight: number;
	readonly unitsPerEm: number;
	/** Advance widths of printable ASCII (U+0020–U+007E) in font units, regular and bold. */
	regular: readonly number[];
	bold: readonly number[];
	/** Advance widths of other characters reports commonly contain, as [regular, bold]. */
	extra: Readonly<Record<string, readonly [regular: number, bold: number]>>;
}

const FIRST_ASCII = 0x20;
const PRINTABLE_ASCII_COUNT = 0x7f - FIRST_ASCII;
const DIGIT_ZERO = 0x30;

/** Checks a font's metrics are complete, so a typo can't quietly skew every column width. */
export function defineExcelFont(font: ExcelFont): ExcelFont {
	const isPositive = (n: number) => Number.isFinite(n) && n > 0;
	const problems = [
		!isPositive(font.size) && 'size',
		!isPositive(font.lineHeight) && 'lineHeight',
		!isPositive(font.unitsPerEm) && 'unitsPerEm',
		(font.regular.length !== PRINTABLE_ASCII_COUNT || !font.regular.every(isPositive)) && 'regular',
		(font.bold.length !== PRINTABLE_ASCII_COUNT || !font.bold.every(isPositive)) && 'bold',
		Object.entries(font.extra).some(
			([char, widths]) => [...char].length !== 1 || !widths.every(isPositive)
		) && 'extra'
	].filter(Boolean);
	if (problems.length > 0) {
		throw new Error(`Invalid metrics for Excel font ${font.name}: ${problems.join(', ')}`);
	}
	return font;
}

// Not Aptos: Calibri is on every Office install, and LibreOffice/ChromeOS swap in metric-twin Carlito.
// Metrics are Carlito's: Copyright 2013 The Carlito Project Authors (https://github.com/googlefonts/carlito), SIL Open Font License 1.1.
export const CALIBRI_11: ExcelFont = defineExcelFont({
	name: 'Calibri',
	size: 11,
	lineHeight: 15,
	unitsPerEm: 2048,
	// prettier-ignore
	regular: [
		463, 667, 821, 1020, 1038, 1464, 1397, 452, 621, 621, 1020, 1020, 511, 627, 517, 791,
		1038, 1038, 1038, 1038, 1038, 1038, 1038, 1038, 1038, 1038, 548, 548, 1020, 1020, 1020, 949,
		1831, 1185, 1114, 1092, 1260, 1000, 941, 1292, 1276, 516, 653, 1064, 861, 1751, 1322, 1356,
		1058, 1378, 1112, 941, 998, 1314, 1162, 1822, 1063, 998, 959, 628, 791, 628, 1020, 1020,
		596, 981, 1076, 866, 1076, 1019, 625, 964, 1076, 470, 490, 931, 470, 1636, 1076, 1080,
		1076, 1076, 714, 801, 686, 1076, 925, 1464, 887, 927, 809, 644, 943, 644, 1020
	],
	// prettier-ignore
	bold: [
		463, 667, 898, 1020, 1038, 1493, 1443, 478, 638, 638, 1020, 1020, 528, 627, 547, 880,
		1038, 1038, 1038, 1038, 1038, 1038, 1038, 1038, 1038, 1038, 565, 565, 1020, 1020, 1020, 949,
		1840, 1241, 1148, 1084, 1291, 999, 940, 1305, 1292, 546, 678, 1120, 866, 1790, 1349, 1385,
		1090, 1405, 1153, 968, 1014, 1337, 1211, 1856, 1128, 1064, 979, 665, 880, 665, 1020, 1020,
		615, 1011, 1099, 857, 1099, 1031, 648, 971, 1099, 503, 523, 983, 503, 1666, 1099, 1101,
		1099, 1099, 728, 817, 710, 1099, 969, 1526, 941, 970, 814, 704, 973, 704, 1020
	],
	extra: {
		'–': [1020, 1020],
		'—': [1854, 1854],
		'·': [517, 548],
		'•': [1020, 1020],
		'…': [1414, 1457],
		'°': [694, 701],
		'‘': [511, 528],
		'’': [511, 528],
		'“': [857, 891],
		'”': [857, 891]
	}
});

/** Call once per export and pass the result to both the sheet builders and `writeWorkbook`. */
export function getExcelExportFont(): ExcelFont {
	return CALIBRI_11;
}

function pxPerUnit(font: ExcelFont): number {
	return (font.size * 96) / 72 / font.unitsPerEm;
}

function isWideCharacter(codePoint: number): boolean {
	return (
		(codePoint >= 0x1100 && codePoint <= 0x115f) ||
		(codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
		(codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
		(codePoint >= 0xf900 && codePoint <= 0xfaff) ||
		(codePoint >= 0xfe30 && codePoint <= 0xfe4f) ||
		(codePoint >= 0xff00 && codePoint <= 0xff60) ||
		(codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
		(codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
		(codePoint >= 0x20000 && codePoint <= 0x3fffd)
	);
}

/** Excel's column-width unit: the widest digit in whole pixels at 96 DPI. */
export function maxDigitWidthPx(font: ExcelFont): number {
	const digits = font.regular.slice(DIGIT_ZERO - FIRST_ASCII, DIGIT_ZERO - FIRST_ASCII + 10);
	return Math.round(Math.max(...digits) * pxPerUnit(font));
}

/** Excel pads every column's content by a quarter-digit margin each side plus a gridline. */
function columnPaddingPx(font: ExcelFont): number {
	return 2 * Math.ceil(maxDigitWidthPx(font) / 4) + 1;
}

export function measureTextPx(text: string, font: ExcelFont, bold = false): number {
	const advances = bold ? font.bold : font.regular;
	// Unlisted glyphs count as a digit (currency symbols usually are one) or, if CJK, a full em.
	const fallback = font.regular[DIGIT_ZERO - FIRST_ASCII];
	let units = 0;
	for (const char of text) {
		const codePoint = char.codePointAt(0) ?? 0;
		const ascii = codePoint - FIRST_ASCII;
		if (ascii >= 0 && ascii < advances.length) {
			units += advances[ascii];
		} else if (char in font.extra) {
			units += font.extra[char][bold ? 1 : 0];
		} else {
			units += isWideCharacter(codePoint) ? font.unitsPerEm : fallback;
		}
	}
	return units * pxPerUnit(font);
}

export function pxToColumnWidth(px: number, font: ExcelFont): number {
	return Math.ceil(((px + columnPaddingPx(font)) / maxDigitWidthPx(font)) * 256) / 256;
}

export function columnWidthToPx(width: number, font: ExcelFont): number {
	return Math.max(0, width * maxDigitWidthPx(font) - columnPaddingPx(font));
}
