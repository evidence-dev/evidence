// Excel rejects a malformed number format by offering to repair the whole workbook, so only
// codes that pass this conservative check are written; anything else falls back to General.
const COLORS = new Set(['black', 'blue', 'cyan', 'green', 'magenta', 'red', 'white', 'yellow']);
const LITERALS = new Set([..."0123456789#?.,%Ee+-/ $():!^&'~{}<>=@€£¥₹₩₦"]);
const DATE_TIME = new Set([...'ymdhsYMDHS']);

function isValidBracket(content: string): boolean {
	const lower = content.toLowerCase();
	if (COLORS.has(lower)) return true;
	if (lower.startsWith('color')) {
		const n = Number(lower.slice(5));
		return Number.isInteger(n) && n >= 1 && n <= 56;
	}
	if (content.startsWith('$')) return true;
	if (/^(h+|m+|s+)$/i.test(content)) return true;
	return /^(<=|>=|<>|<|>|=)-?\d+(\.\d+)?$/.test(content);
}

export function isValidExcelNumFmt(code: string): boolean {
	if (code.trim() === '') return false;
	let sections = 1;
	let hasText = false;
	let hasDigits = false;
	let i = 0;
	while (i < code.length) {
		const c = code[i];
		let next = i + 1;
		if (c === '"') {
			const end = code.indexOf('"', i + 1);
			if (end === -1) return false;
			next = end + 1;
		} else if (c === '\\' || c === '_' || c === '*') {
			if (i + 1 >= code.length) return false;
			next = i + 2;
		} else if (c === '[') {
			const end = code.indexOf(']', i + 1);
			if (end === -1 || !isValidBracket(code.slice(i + 1, end))) return false;
			next = end + 1;
		} else if (c === ';') {
			if (hasText && hasDigits) return false;
			if (++sections > 4) return false;
			hasText = hasDigits = false;
		} else if (code.slice(i, i + 7).toLowerCase() === 'general') {
			next = i + 7;
		} else if (code.slice(i, i + 5).toUpperCase() === 'AM/PM') {
			next = i + 5;
		} else if (code.slice(i, i + 3).toUpperCase() === 'A/P') {
			next = i + 3;
		} else if (LITERALS.has(c)) {
			if (c === '@') hasText = true;
			if (c === '0' || c === '#' || c === '?') hasDigits = true;
		} else if (!DATE_TIME.has(c)) {
			return false;
		}
		i = next;
	}
	return !(hasText && hasDigits);
}
