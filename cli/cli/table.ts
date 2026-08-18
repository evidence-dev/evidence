import Table from 'cli-table3';

type Cell = string | number | null | undefined;

const toStr = (v: Cell, nullText: string) => (v === null || v === undefined ? nullText : String(v));

// Empty head/border arrays disable cli-table3's ANSI colours (pipe-safe).
const NO_COLOR = { head: [] as string[], border: [] as string[] };

// compact: keep the outer border + header rule, drop per-row separators (noisy at length).
export function renderTable(head: string[], rows: Cell[][], nullText = 'NULL'): string {
	const table = new Table({ head, style: { ...NO_COLOR, compact: true } });
	for (const row of rows) table.push(row.map((c) => toStr(c, nullText)));
	return table.toString();
}

const BORDERLESS = {
	top: '',
	'top-mid': '',
	'top-left': '',
	'top-right': '',
	bottom: '',
	'bottom-mid': '',
	'bottom-left': '',
	'bottom-right': '',
	left: '',
	'left-mid': '',
	mid: '',
	'mid-mid': '',
	right: '',
	'right-mid': '',
	middle: ''
};

export function renderCompactTable(head: string[], rows: Cell[][], nullText = '—'): string {
	const table = new Table({
		head,
		chars: BORDERLESS,
		style: { ...NO_COLOR, 'padding-left': 0, 'padding-right': 2 }
	});
	for (const row of rows) table.push(row.map((c) => toStr(c, nullText)));

	const lines = table.toString().split('\n');
	const width = Math.max(0, ...lines.map((l) => l.length));
	return [lines[0], '─'.repeat(width), ...lines.slice(1)].join('\n');
}
