import { describe, it, expect, afterEach } from 'vitest';
import {
	resolveFormat,
	resolveColor,
	resolveInteractive,
	applyColumns,
	escapeCsv,
	formatNdjson,
	formatJson,
	formatCsv,
	type OutputOptions,
	type ResultData
} from './output.ts';

const baseOpts: OutputOptions = {
	format: null,
	columns: null,
	limit: null,
	all: false,
	verbose: false,
	interactive: false,
	color: true
};

const rows: ResultData = {
	kind: 'rows',
	columns: [
		{ name: 'a', type: 'int' },
		{ name: 'b', type: 'text' }
	],
	rows: [
		{ a: 1, b: 'x' },
		{ a: 2, b: 'y' }
	]
};

describe('resolveFormat', () => {
	it('uses NDJSON by default for row-sets and name-lists', () => {
		expect(resolveFormat(baseOpts, 'rows')).toBe('ndjson');
		expect(resolveFormat(baseOpts, 'name-list')).toBe('ndjson');
	});

	it('uses compact JSON by default for structured data', () => {
		expect(resolveFormat(baseOpts, 'structured')).toBe('json');
	});

	it('maps --verbose to table', () => {
		expect(resolveFormat({ ...baseOpts, verbose: true }, 'rows')).toBe('table');
		expect(resolveFormat({ ...baseOpts, verbose: true }, 'structured')).toBe('table');
	});

	it('defaults to the table at an interactive terminal', () => {
		expect(resolveFormat({ ...baseOpts, interactive: true }, 'rows')).toBe('table');
		expect(resolveFormat({ ...baseOpts, interactive: true }, 'name-list')).toBe('table');
		expect(resolveFormat({ ...baseOpts, interactive: true }, 'structured')).toBe('table');
	});

	it('keeps machine defaults when non-interactive', () => {
		expect(resolveFormat({ ...baseOpts, interactive: false }, 'rows')).toBe('ndjson');
		expect(resolveFormat({ ...baseOpts, interactive: false }, 'structured')).toBe('json');
	});

	it('lets an explicit --format win over --verbose and interactivity', () => {
		expect(resolveFormat({ ...baseOpts, verbose: true, format: 'csv' }, 'rows')).toBe('csv');
		expect(resolveFormat({ ...baseOpts, format: 'ndjson' }, 'structured')).toBe('ndjson');
		expect(resolveFormat({ ...baseOpts, interactive: true, format: 'json' }, 'rows')).toBe('json');
	});
});

describe('resolveColor', () => {
	const original = process.env.NO_COLOR;
	afterEach(() => {
		if (original === undefined) delete process.env.NO_COLOR;
		else process.env.NO_COLOR = original;
	});

	it('disables color when --no-color is passed', () => {
		delete process.env.NO_COLOR;
		expect(resolveColor(true)).toBe(false);
	});

	it('disables color when NO_COLOR is set to a non-empty value', () => {
		process.env.NO_COLOR = '1';
		expect(resolveColor(false)).toBe(false);
	});

	it('allows color when NO_COLOR is empty or unset', () => {
		process.env.NO_COLOR = '';
		expect(resolveColor(false)).toBe(true);
		delete process.env.NO_COLOR;
		expect(resolveColor(false)).toBe(true);
	});
});

describe('resolveInteractive', () => {
	const original = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
	afterEach(() => {
		if (original) Object.defineProperty(process.stdout, 'isTTY', original);
	});

	it('is true when stdout is a TTY', () => {
		Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
		expect(resolveInteractive()).toBe(true);
	});

	it('is false when stdout is piped/redirected (isTTY undefined)', () => {
		Object.defineProperty(process.stdout, 'isTTY', { value: undefined, configurable: true });
		expect(resolveInteractive()).toBe(false);
	});
});

describe('formatNdjson', () => {
	it('emits one valid JSON object per line for rows', () => {
		const out = formatNdjson(rows);
		const lines = out.split('\n');
		expect(lines).toHaveLength(2);
		expect(JSON.parse(lines[0])).toEqual({ a: 1, b: 'x' });
		expect(JSON.parse(lines[1])).toEqual({ a: 2, b: 'y' });
	});

	it('emits an empty string for no rows', () => {
		expect(formatNdjson({ kind: 'rows', columns: [], rows: [] })).toBe('');
	});

	it('emits plain names (not JSON-quoted) for a name-list', () => {
		expect(formatNdjson({ kind: 'name-list', names: ['public.orders', 'public.users'] })).toBe(
			'public.orders\npublic.users'
		);
	});

	it('emits one element per line for a structured array', () => {
		const out = formatNdjson({ kind: 'structured', value: [{ x: 1 }, { x: 2 }] });
		expect(out.split('\n').map((l) => JSON.parse(l))).toEqual([{ x: 1 }, { x: 2 }]);
	});
});

describe('formatJson', () => {
	it('is compact (single line, no indentation)', () => {
		const out = formatJson(rows);
		expect(out).toBe('[{"a":1,"b":"x"},{"a":2,"b":"y"}]');
		expect(out).not.toContain('\n');
	});
});

describe('escapeCsv / formatCsv', () => {
	it('quotes values containing commas, quotes, and newlines', () => {
		expect(escapeCsv('a,b')).toBe('"a,b"');
		expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
		expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"');
		expect(escapeCsv('cr\r')).toBe('"cr\r"');
	});

	it('renders null/undefined as empty and objects as JSON', () => {
		expect(escapeCsv(null)).toBe('');
		expect(escapeCsv(undefined)).toBe('');
		expect(escapeCsv({ k: 1 })).toBe('"{""k"":1}"');
	});

	it('produces a header row and follows column order', () => {
		const out = formatCsv(rows);
		expect(out).toBe('a,b\n1,x\n2,y');
	});

	it('renders a name-list as one escaped value per line, no header', () => {
		expect(formatCsv({ kind: 'name-list', names: ['a,b', 'c'] })).toBe('"a,b"\nc');
	});
});

describe('applyColumns', () => {
	it('selects and reorders columns for rows', () => {
		const out = applyColumns(rows, ['b', 'a']);
		expect(out.columns?.map((c) => c.name)).toEqual(['b', 'a']);
		expect(out.rows).toEqual([
			{ b: 'x', a: 1 },
			{ b: 'y', a: 2 }
		]);
	});

	it('keeps unknown columns as null to keep the shape stable', () => {
		const out = applyColumns(rows, ['a', 'missing']);
		expect(out.rows).toEqual([
			{ a: 1, missing: null },
			{ a: 2, missing: null }
		]);
	});

	it('is a no-op for non-row kinds', () => {
		const nameList: ResultData = { kind: 'name-list', names: ['x'] };
		expect(applyColumns(nameList, ['a'])).toBe(nameList);
	});
});
