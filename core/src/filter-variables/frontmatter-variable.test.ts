import { describe, it, expect } from 'vitest';
import { createFrontmatterVariablePattern, stripOneQuotePair } from './frontmatter-variable';
import { interpolateFrontmatterVariables } from './VariableProcessor';

describe('stripOneQuotePair', () => {
	it('strips a single-quote pair', () => {
		expect(stripOneQuotePair("'total_attendance'")).toBe('total_attendance');
	});

	it('strips a double-quote pair', () => {
		expect(stripOneQuotePair('"total_attendance"')).toBe('total_attendance');
	});

	it('leaves an unquoted value untouched', () => {
		expect(stripOneQuotePair('Attendance')).toBe('Attendance');
	});

	it('strips only one outer pair', () => {
		expect(stripOneQuotePair("''x''")).toBe("'x'");
	});

	it('does not strip mismatched quotes', () => {
		expect(stripOneQuotePair('\'x"')).toBe('\'x"');
	});

	it('leaves a lone quote untouched', () => {
		expect(stripOneQuotePair("'")).toBe("'");
	});
});

describe('createFrontmatterVariablePattern', () => {
	const capture = (s: string): Array<[string, string | undefined]> => {
		const out: Array<[string, string | undefined]> = [];
		const re = createFrontmatterVariablePattern();
		let m: RegExpExecArray | null;
		while ((m = re.exec(s)) !== null) out.push([m[1], m[2]]);
		return out;
	};

	it('captures path with no fallback (group 2 undefined)', () => {
		expect(capture('{{ $metric }}')).toEqual([['metric', undefined]]);
	});

	it('captures path and raw quoted fallback', () => {
		expect(capture("{{ $metric | 'total_attendance' }}")).toEqual([
			['metric', "'total_attendance'"]
		]);
	});

	it('captures path and raw unquoted fallback', () => {
		expect(capture('{{ $metric_label | Attendance }}')).toEqual([['metric_label', 'Attendance']]);
	});

	it('captures an empty fallback as an empty string', () => {
		expect(capture('{{ $metric | }}')).toEqual([['metric', '']]);
	});

	it('preserves internal whitespace in an unquoted fallback but trims the edges', () => {
		expect(capture('{{ $metric | total attendance }}')).toEqual([['metric', 'total attendance']]);
	});
});

describe('interpolateFrontmatterVariables — fallback support', () => {
	const vars = { metric: 'total_attendance', nested: { label: 'Weekly' }, empty: null };

	it('uses the variable value and ignores the fallback when defined', () => {
		expect(interpolateFrontmatterVariables("sum({{ $metric | 'x' }})", vars)).toBe(
			'sum(total_attendance)'
		);
	});

	it('uses the quote-stripped fallback when the variable is missing', () => {
		expect(interpolateFrontmatterVariables("sum({{ $missing | 'total_attendance' }})", vars)).toBe(
			'sum(total_attendance)'
		);
	});

	it('uses an unquoted fallback verbatim when the variable is missing', () => {
		expect(interpolateFrontmatterVariables('# {{ $missing | Attendance }}', vars)).toBe(
			'# Attendance'
		);
	});

	it('resolves a nested path and ignores its fallback', () => {
		expect(interpolateFrontmatterVariables("{{ $nested.label | 'x' }}", vars)).toBe('Weekly');
	});

	it('falls back when a nested path is missing', () => {
		expect(interpolateFrontmatterVariables("{{ $nested.missing | 'x' }}", vars)).toBe('x');
	});

	// DECISION 2: a defined-but-null variable resolves to '', not the fallback.
	it('resolves a null variable to empty string without applying the fallback', () => {
		expect(interpolateFrontmatterVariables("[{{ $empty | 'fallback' }}]", vars)).toBe('[]');
	});

	it('leaves the literal in place for a missing variable with no fallback', () => {
		expect(interpolateFrontmatterVariables('{{ $missing }}', vars)).toBe('{{ $missing }}');
	});

	it('resolves an empty fallback to an empty string', () => {
		expect(interpolateFrontmatterVariables('[{{ $missing | }}]', vars)).toBe('[]');
	});
});

describe('interpolateFrontmatterVariables — array index paths', () => {
	// The query/SQL resolver must reach [n]-indexed values, matching the fork's
	// text resolution — otherwise an existing value is silently masked by the fallback.
	const vars = {
		items: ['a', 'b', 'c'],
		data: { rows: [{ name: 'first' }, { name: 'second' }] }
	};

	it('resolves a top-level array index', () => {
		expect(interpolateFrontmatterVariables('{{ $items[0] }}', vars)).toBe('a');
	});

	it('resolves an array index and ignores the fallback when in range', () => {
		expect(interpolateFrontmatterVariables("{{ $items[1] | 'x' }}", vars)).toBe('b');
	});

	it('resolves a nested path that mixes dots and an array index', () => {
		expect(interpolateFrontmatterVariables("{{ $data.rows[1].name | 'x' }}", vars)).toBe('second');
	});

	it('uses the fallback for an out-of-range index', () => {
		expect(interpolateFrontmatterVariables("{{ $items[9] | 'default' }}", vars)).toBe('default');
	});
});
