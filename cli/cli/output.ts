/**
 * Centralized output formatting for the Evidence CLI.
 *
 * Design: a human at an interactive terminal gets the pretty (aligned table +
 * full columns) view; everything else — piped, redirected, agents, CI — gets
 * plain, machine-readable output. The mode is decided by TTY detection on
 * stdout and can always be forced with `--verbose` (human) or
 * `--json`/`--format` (machine). Every data-producing command routes results
 * through `printResult` so format/columns/limit/color behave consistently and
 * adding a command can't regress it.
 */

import { renderTable } from './table.ts';

export type OutputFormat = 'json' | 'ndjson' | 'csv' | 'table';

/**
 * The shape of a result, which decides its DEFAULT (no-flag) rendering:
 * - `rows`        — a result set (columns + row objects) → NDJSON by default.
 * - `name-list`   — a pure list of names → one name per line by default.
 * - `structured`  — an arbitrary object/array → compact JSON by default.
 */
export type ResultKind = 'rows' | 'name-list' | 'structured';

export interface Column {
	name: string;
	type?: string;
}

export interface OutputOptions {
	/** Explicit `--format`/`--json`; null means "use the default for the kind". */
	format: OutputFormat | null;
	/** `--columns a,b,c` — select and order columns (rows only). */
	columns: string[] | null;
	/** Row cap; null when unset. */
	limit: number | null;
	/** `--all` — remove the row cap (overrides `limit`). */
	all: boolean;
	/** `-v`/`--verbose` — force the human view (pretty table + full columns). */
	verbose: boolean;
	/**
	 * Whether stdout is an interactive terminal. When no explicit format is
	 * given, this picks the default: human table when true, machine-readable
	 * when false. Resolved once at parse time; `--verbose`/`--json` override it.
	 */
	interactive: boolean;
	/** Resolved from `--no-color` + `NO_COLOR` env. */
	color: boolean;
}

export interface ResultData {
	kind: ResultKind;
	/** for kind 'rows' */
	columns?: Column[];
	rows?: Record<string, unknown>[];
	/** for kind 'name-list' */
	names?: string[];
	/** for kind 'structured' */
	value?: unknown;
	/** A note printed to STDERR after the data (e.g. a truncation warning). */
	note?: string;
}

// ============================================================================
// Format resolution
// ============================================================================

/**
 * Decide the concrete output format. Precedence: an explicit `--format`/`--json`
 * always wins; `--verbose` forces the human table; otherwise the default is
 * chosen by interactivity — a human at a terminal gets the table, a pipe/agent
 * gets the machine-readable default for the kind.
 */
export function resolveFormat(opts: OutputOptions, kind: ResultKind): OutputFormat {
	if (opts.format) return opts.format;
	if (opts.verbose) return 'table';
	if (opts.interactive) return 'table';
	return kind === 'structured' ? 'json' : 'ndjson';
}

/**
 * Whether output should default to the human view: true only when stdout is an
 * interactive terminal. Piped/redirected stdout (agents, CI, `| jq`, `> file`)
 * is non-interactive and falls back to machine-readable output.
 */
export function resolveInteractive(): boolean {
	return Boolean(process.stdout.isTTY);
}

/**
 * Resolve whether color is allowed. `--no-color` or a set (non-empty)
 * `NO_COLOR` env var disables it.
 */
export function resolveColor(noColorFlag: boolean): boolean {
	if (noColorFlag) return false;
	if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') return false;
	return true;
}

// ============================================================================
// Column selection
// ============================================================================

/**
 * Select and reorder columns for a row-set. Unknown columns are kept as
 * `null`-valued so the output shape stays stable (CSV headers/NDJSON keys are
 * predictable). No-op for non-row kinds.
 */
export function applyColumns(data: ResultData, cols: string[] | null): ResultData {
	if (!cols || cols.length === 0 || data.kind !== 'rows') return data;
	const columns: Column[] = cols.map((name) => {
		const existing = data.columns?.find((c) => c.name === name);
		return existing ?? { name };
	});
	const rows = (data.rows ?? []).map((row) => {
		const out: Record<string, unknown> = {};
		for (const c of cols) out[c] = c in row ? row[c] : null;
		return out;
	});
	return { ...data, columns, rows };
}

// ============================================================================
// Formatters (pure; exported for unit tests)
// ============================================================================

/** Escape a single value for CSV. */
export function escapeCsv(val: unknown): string {
	if (val === null || val === undefined) return '';
	const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
	if (/[",\n\r]/.test(str)) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

/** Resolve the column order for a row-set: explicit columns, else union of keys. */
function rowColumnNames(data: ResultData): string[] {
	if (data.columns && data.columns.length > 0) return data.columns.map((c) => c.name);
	const seen = new Set<string>();
	for (const row of data.rows ?? []) {
		for (const key of Object.keys(row)) seen.add(key);
	}
	return [...seen];
}

/** NDJSON / plain-lines: one JSON object (or one name) per line. */
export function formatNdjson(data: ResultData): string {
	if (data.kind === 'name-list') return (data.names ?? []).join('\n');
	if (data.kind === 'structured') {
		return Array.isArray(data.value)
			? data.value.map((v) => JSON.stringify(v)).join('\n')
			: JSON.stringify(data.value);
	}
	return (data.rows ?? []).map((row) => JSON.stringify(row)).join('\n');
}

/** Compact JSON (never pretty-printed). */
export function formatJson(data: ResultData): string {
	if (data.kind === 'name-list') return JSON.stringify(data.names ?? []);
	if (data.kind === 'structured') return JSON.stringify(data.value);
	return JSON.stringify(data.rows ?? []);
}

/** CSV with a header row (RFC-4180-ish quoting). */
export function formatCsv(data: ResultData): string {
	if (data.kind === 'name-list') {
		return (data.names ?? []).map((n) => escapeCsv(n)).join('\n');
	}
	if (data.kind === 'structured') {
		// Only an array of objects has a meaningful tabular form; otherwise emit JSON.
		if (!Array.isArray(data.value)) return JSON.stringify(data.value);
		return formatCsv({ kind: 'rows', rows: data.value as Record<string, unknown>[] });
	}
	const headers = rowColumnNames(data);
	if (headers.length === 0) return '';
	const lines = [headers.map((h) => escapeCsv(h)).join(',')];
	for (const row of data.rows ?? []) {
		lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
	}
	return lines.join('\n');
}

/** Pretty aligned table (box-drawing). Long cells are truncated. */
export function formatTable(data: ResultData): string {
	if (data.kind === 'name-list') {
		const names = data.names ?? [];
		if (names.length === 0) return 'No results';
		return renderTable(
			['name'],
			names.map((n) => [n])
		);
	}
	if (data.kind === 'structured') {
		if (!Array.isArray(data.value)) return JSON.stringify(data.value, null, 2);
		return formatTable({ kind: 'rows', rows: data.value as Record<string, unknown>[] });
	}
	const headers = rowColumnNames(data);
	if (headers.length === 0) return 'No columns returned';
	const rows = (data.rows ?? []).map((row) =>
		headers.map((h) => {
			const val = row[h];
			if (val === null || val === undefined) return 'NULL';
			const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
			return str.length > 50 ? str.slice(0, 49) + '…' : str;
		})
	);
	return renderTable(headers, rows);
}

// ============================================================================
// Entry point
// ============================================================================

/** Truncate a row-set / name-list to `limit` (unless `--all`). Returns whether it truncated. */
function applyLimit(
	data: ResultData,
	opts: OutputOptions
): { data: ResultData; truncated: boolean } {
	if (opts.all || opts.limit === null) return { data, truncated: false };
	if (data.kind === 'rows' && (data.rows?.length ?? 0) > opts.limit) {
		return { data: { ...data, rows: data.rows!.slice(0, opts.limit) }, truncated: true };
	}
	if (data.kind === 'name-list' && (data.names?.length ?? 0) > opts.limit) {
		return { data: { ...data, names: data.names!.slice(0, opts.limit) }, truncated: true };
	}
	return { data, truncated: false };
}

/**
 * Render `data` to a string in the resolved format, applying column selection
 * and the row limit. Does not write anywhere — callers route it to stdout or a
 * file. `data.note` is not included (it belongs on stderr; see `printResult`).
 */
export function renderResult(data: ResultData, opts: OutputOptions): string {
	const selected = applyColumns(data, opts.columns);
	const { data: limited } = applyLimit(selected, opts);
	const fmt = resolveFormat(opts, data.kind);

	switch (fmt) {
		case 'ndjson':
			return formatNdjson(limited);
		case 'json':
			return formatJson(limited);
		case 'csv':
			return formatCsv(limited);
		case 'table':
			return formatTable(limited);
	}
}

/**
 * Render `data` to stdout in the resolved format. Any `data.note` goes to
 * stderr so it never pollutes the machine-readable payload on stdout.
 */
export function printResult(data: ResultData, opts: OutputOptions): void {
	const rendered = renderResult(data, opts);
	process.stdout.write(rendered + '\n');
	if (data.note) process.stderr.write(data.note + '\n');
}

// ============================================================================
// Errors
// ============================================================================

export const EXIT_OK = 0;
export const EXIT_ERROR = 1;
export const EXIT_USAGE = 2;

/**
 * Report an error to stderr and exit. Under json/ndjson formats the error is
 * emitted as `{"error":<msg>,"code":<code>}` for easy machine parsing.
 */
export function fail(
	err: unknown,
	opts: Pick<OutputOptions, 'format'>,
	code = 'ERROR',
	exitCode: number = EXIT_ERROR
): never {
	const message = err instanceof Error ? err.message : String(err);
	if (opts.format === 'json' || opts.format === 'ndjson') {
		process.stderr.write(JSON.stringify({ error: message, code }) + '\n');
	} else {
		process.stderr.write(message + '\n');
	}
	process.exit(exitCode);
}
