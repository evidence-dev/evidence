/**
 * Pure SQL helpers for the Coupler.io connector.
 *
 * Coupler.io's query endpoint runs one DuckDB statement against one dataset,
 * exposed as the table `data`. Evidence SQL instead names datasets as tables
 * (`select … from funnel`), so the executor:
 *   1. finds which configured table the statement reads (findTableRefs) and
 *      rejects any other table, since no dataset can serve it,
 *   2. prepends that table as a CTE over `data` (withTableCte),
 *   3. sends it to that dataset's query endpoint.
 *
 * The CTE is a typed view (typedViewSql): snapshots store dates and timestamps
 * as ISO-8601 text, so it casts each column to the type the Public API reports
 * for it.
 */

import type { Column } from '../../user-components/interfaces/query-service';
import { CouplerIoDialect } from '../../sql-dialect/coupler-io';
import { getMotherduckToJsType } from '../motherduck/type-mapping';

/** Column shape from GET /v1/workspaces/{id}/datasets/{id} (`columns[]`). */
export type CouplerIoApiColumn = {
	key?: string;
	label?: string | null;
	/** Column name in the `data` table — what SQL references. */
	dbName?: string;
	schema?: { type?: string; format?: string };
};

export type CouplerIoViewColumn = { name: string; duckType: string };

/** Public API column schema (JSON-schema type/format) → DuckDB type. */
export function couplerIoDuckType(schema: CouplerIoApiColumn['schema']): string {
	switch (schema?.type?.toLowerCase()) {
		case 'integer':
			return 'BIGINT';
		case 'number':
			return 'DOUBLE';
		case 'boolean':
			return 'BOOLEAN';
		case 'string': {
			const format = schema?.format?.toLowerCase();
			if (format === 'date') return 'DATE';
			if (format === 'date-time') return 'TIMESTAMP';
			return 'VARCHAR';
		}
		default:
			return 'VARCHAR';
	}
}

const dialect = new CouplerIoDialect();

export function quoteIdent(name: string): string {
	return dialect.quoteAlias(name);
}

/** Visible API columns → typed view columns. Columns without a db name are skipped. */
export function viewColumnsFromApi(columns: CouplerIoApiColumn[]): CouplerIoViewColumn[] {
	return columns
		.filter((c) => typeof c.dbName === 'string' && c.dbName.length > 0)
		.map((c) => ({ name: c.dbName as string, duckType: couplerIoDuckType(c.schema) }));
}

/**
 * SELECT over `data` exposing the API's visible columns, each cast to its API
 * type. TRY_CAST is a no-op where storage already matches (numbers, booleans)
 * and turns ISO-8601 text into DATE/TIMESTAMP.
 */
export function typedViewSql(columns: CouplerIoViewColumn[]): string {
	if (columns.length === 0) return 'SELECT * FROM data';
	const select = columns.map(({ name, duckType }) => {
		const col = quoteIdent(name);
		return duckType === 'VARCHAR' ? col : `TRY_CAST(${col} AS ${duckType}) AS ${col}`;
	});
	return `SELECT ${select.join(', ')} FROM data`;
}

// ---------------------------------------------------------------------------
// Tokenizer — just enough DuckDB lexing to tell identifiers apart from string
// literals, comments, and quoted identifiers.
// ---------------------------------------------------------------------------

type Token =
	| { kind: 'word'; value: string; start: number; end: number }
	| { kind: 'quoted'; value: string; start: number; end: number }
	| { kind: 'string'; value: string; start: number; end: number }
	| { kind: 'punct'; value: string; start: number; end: number };

function tokenize(sql: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	const n = sql.length;
	while (i < n) {
		const ch = sql[i];
		if (/\s/.test(ch)) {
			i++;
		} else if (ch === '-' && sql[i + 1] === '-') {
			while (i < n && sql[i] !== '\n') i++;
		} else if (ch === '/' && sql[i + 1] === '*') {
			const close = sql.indexOf('*/', i + 2);
			i = close === -1 ? n : close + 2;
		} else if (ch === "'") {
			const start = i;
			i++;
			while (i < n) {
				if (sql[i] === "'" && sql[i + 1] === "'") i += 2;
				else if (sql[i] === "'") break;
				else i++;
			}
			i++;
			tokens.push({ kind: 'string', value: sql.slice(start, i), start, end: i });
		} else if (ch === '"') {
			const start = i;
			let value = '';
			i++;
			while (i < n) {
				if (sql[i] === '"' && sql[i + 1] === '"') {
					value += '"';
					i += 2;
				} else if (sql[i] === '"') break;
				else value += sql[i++];
			}
			i++;
			tokens.push({ kind: 'quoted', value, start, end: i });
		} else if (/[A-Za-z_]/.test(ch)) {
			const start = i;
			while (i < n && /[A-Za-z0-9_$]/.test(sql[i])) i++;
			tokens.push({ kind: 'word', value: sql.slice(start, i), start, end: i });
		} else {
			tokens.push({ kind: 'punct', value: ch, start: i, end: i + 1 });
			i++;
		}
	}
	return tokens;
}

const isKeyword = (t: Token | undefined, kw: string) =>
	t?.kind === 'word' && t.value.toUpperCase() === kw;

const isPunct = (t: Token | undefined, p: string) => t?.kind === 'punct' && t.value === p;

/** Index just past the parenthesis group opening at `open`. */
function skipParens(tokens: Token[], open: number): number {
	let depth = 0;
	for (let i = open; i < tokens.length; i++) {
		if (isPunct(tokens[i], '(')) depth++;
		else if (isPunct(tokens[i], ')') && --depth === 0) return i + 1;
	}
	return tokens.length;
}

/**
 * Names the statement defines as CTEs: `name [(cols)] AS [NOT] [MATERIALIZED] (`
 * right after WITH, RECURSIVE, or a comma.
 */
function ownCteNames(tokens: Token[]): Set<string> {
	const names = new Set<string>();
	for (let i = 1; i < tokens.length; i++) {
		const t = tokens[i];
		if (t.kind !== 'word' && t.kind !== 'quoted') continue;
		const prev = tokens[i - 1];
		if (!isKeyword(prev, 'WITH') && !isKeyword(prev, 'RECURSIVE') && !isPunct(prev, ',')) continue;
		let j = i + 1;
		if (isPunct(tokens[j], '(')) j = skipParens(tokens, j);
		if (!isKeyword(tokens[j++], 'AS')) continue;
		if (isKeyword(tokens[j], 'NOT')) j++;
		if (isKeyword(tokens[j], 'MATERIALIZED')) j++;
		if (isPunct(tokens[j], '(')) names.add(t.value.toLowerCase());
	}
	return names;
}

// Keywords that end a FROM clause's comma-separated table list.
const FROM_CLAUSE_END = new Set([
	'WHERE',
	'GROUP',
	'HAVING',
	'QUALIFY',
	'WINDOW',
	'ORDER',
	'LIMIT',
	'OFFSET',
	'UNION',
	'INTERSECT',
	'EXCEPT',
	'SELECT'
]);

// Keywords that open a query, so a parenthesis starting with one is a subquery
// (whose FROM reads tables) rather than a call like `extract(year FROM d)`.
const QUERY_START = new Set([
	'SELECT',
	'WITH',
	'FROM',
	'VALUES',
	'TABLE',
	'PIVOT',
	'UNPIVOT',
	'DESCRIBE',
	'SUMMARIZE'
]);

const isName = (t: Token | undefined) => t?.kind === 'word' || t?.kind === 'quoted';

/**
 * Unqualified tables the statement reads: a name right after FROM, JOIN, or a
 * comma in a FROM list, in the statement itself or a subquery — not a FROM
 * inside a function call (`extract(year FROM d)`), a schema-qualified name
 * (`x.t`), a schema (`t.x`), a table function (`t(...)`), or a CTE the statement
 * defines. Returns names as written, deduplicated case-insensitively.
 */
export function findTableNames(sql: string): string[] {
	const tokens = tokenize(sql);
	const ownCtes = ownCteNames(tokens);

	// One scope per parenthesis level: is it a query, and is it inside a FROM list?
	const scopes = [{ query: true, fromList: false }];
	let expectTable = false;
	const found = new Map<string, string>();
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		const scope = scopes[scopes.length - 1];
		if (isPunct(t, '(')) {
			const first = tokens[i + 1];
			scopes.push({
				query: first?.kind === 'word' && QUERY_START.has(first.value.toUpperCase()),
				fromList: false
			});
			expectTable = false;
			continue;
		}
		if (isPunct(t, ')')) {
			if (scopes.length > 1) scopes.pop();
			expectTable = false;
			continue;
		}
		if (!scope.query) continue;
		if (isPunct(t, ';')) {
			scope.fromList = expectTable = false;
		} else if (isKeyword(t, 'FROM')) {
			scope.fromList = expectTable = true;
		} else if (isKeyword(t, 'JOIN')) {
			expectTable = true;
		} else if (isPunct(t, ',')) {
			expectTable = scope.fromList;
		} else if (t.kind === 'word' && FROM_CLAUSE_END.has(t.value.toUpperCase())) {
			scope.fromList = expectTable = false;
		} else if (expectTable && !isKeyword(t, 'LATERAL')) {
			expectTable = false;
			const next = tokens[i + 1];
			if (!isName(t) || isPunct(next, '.') || isPunct(next, '(')) continue;
			const key = t.value.toLowerCase();
			if (!ownCtes.has(key) && !found.has(key)) found.set(key, t.value);
		}
	}
	return [...found.values()];
}

/**
 * Configured table names the statement reads (see findTableNames), as configured,
 * plus any other table it reads (`unknown`) — which no dataset can serve.
 */
export function findTableRefs(
	sql: string,
	tableNames: Iterable<string>
): { refs: string[]; unknown: string[] } {
	const byLower = new Map<string, string>();
	for (const name of tableNames) byLower.set(name.toLowerCase(), name);
	const refs: string[] = [];
	const unknown: string[] = [];
	for (const name of findTableNames(sql)) {
		const canonical = byLower.get(name.toLowerCase());
		if (canonical) refs.push(canonical);
		else unknown.push(name);
	}
	return { refs, unknown };
}

const isTableCommand = (t: Token | undefined) =>
	isKeyword(t, 'DESCRIBE') || isKeyword(t, 'SUMMARIZE');

/**
 * `DESCRIBE t` / `SUMMARIZE t` → `DESCRIBE SELECT * FROM t`, so the table read is
 * a FROM like any other and the dataset CTE can go in front of the query. Also
 * applies where the command opens a subquery, as in Evidence's row-limit and
 * column-probe wrappers: `SELECT * FROM (SUMMARIZE t) LIMIT 1000`.
 */
export function expandTableCommand(sql: string): string {
	const tokens = tokenize(sql);
	let out = sql;
	// Right to left, so earlier offsets stay valid as text is inserted.
	for (let i = tokens.length - 2; i >= 0; i--) {
		if (!isTableCommand(tokens[i]) || (i > 0 && !isPunct(tokens[i - 1], '('))) continue;
		const target = tokens[i + 1];
		if (
			!isName(target) ||
			(target.kind === 'word' && QUERY_START.has(target.value.toUpperCase()))
		) {
			continue;
		}
		out = `${out.slice(0, target.start)}SELECT * FROM ${out.slice(target.start)}`;
	}
	return out;
}

/**
 * Prepend `name AS (viewSql)` to the statement's WITH clause (or add one).
 * Statements that start with DESCRIBE/SUMMARIZE get the CTE on the query after it.
 */
export function withTableCte(sql: string, name: string, viewSql: string): string {
	// MATERIALIZED: Coupler.io's DuckDB (1.5.x) hits an internal error inlining a CTE
	// over the `data` scan when the statement is wrapped in a subquery (e.g.
	// `SELECT * FROM (…) LIMIT n`) and references the table more than once.
	const cte = `${quoteIdent(name)} AS MATERIALIZED (${viewSql})`;
	const tokens = tokenize(sql);
	let idx = 0;
	if (isKeyword(tokens[0], 'DESCRIBE') || isKeyword(tokens[0], 'SUMMARIZE')) idx = 1;
	const head = tokens[idx];
	if (!head) return `WITH ${cte} ${sql}`;

	if (isKeyword(head, 'WITH')) {
		const after = isKeyword(tokens[idx + 1], 'RECURSIVE') ? tokens[idx + 1] : head;
		return `${sql.slice(0, after.end)} ${cte},${sql.slice(after.end)}`;
	}
	return `${sql.slice(0, head.start)}WITH ${cte} ${sql.slice(head.start)}`;
}

// ---------------------------------------------------------------------------
// Result typing — the query endpoint returns rows only, so infer column types from values.
// ---------------------------------------------------------------------------

// The query endpoint serializes DATE as `2025-01-01` and TIMESTAMP as an ISO
// instant (`2025-01-01T10:00:00.000Z`).
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function inferType(values: unknown[]): string {
	const sample = values[0];
	switch (typeof sample) {
		case 'number':
			// JSON drops the integer/float distinction; whole values in every row read as integers.
			return values.every((v) => Number.isInteger(v)) ? 'BIGINT' : 'DOUBLE';
		case 'boolean':
			return 'BOOLEAN';
		case 'string':
			// Every value has to match: a text column can hold one date-looking value.
			if (values.every((v) => typeof v === 'string' && DATE_RE.test(v))) return 'DATE';
			if (values.every((v) => typeof v === 'string' && ISO_INSTANT_RE.test(v))) return 'TIMESTAMP';
			return 'VARCHAR';
		case 'object':
			return 'JSON_OBJECT';
		default:
			return 'UNKNOWN';
	}
}

/**
 * Column metadata inferred from row values. Text values are ambiguous (a VARCHAR
 * column can hold date-looking strings), so a column named like a dataset column
 * takes that column's type from `knownTypes` instead. A column whose values are
 * all null comes back as `unknown` (the caller can DESCRIBE).
 */
export function inferColumns(
	rows: Record<string, unknown>[],
	knownTypes: ReadonlyMap<string, string> = new Map()
): Column[] {
	return Object.keys(rows[0] ?? {}).map((name) => {
		const values = rows.map((r) => r[name]).filter((v) => v !== null && v !== undefined);
		const known = knownTypes.get(name);
		const type = known && typeof values[0] === 'string' ? known : inferType(values);
		return {
			name,
			clickhouseType: type,
			jsType: type === 'JSON_OBJECT' ? 'object' : getMotherduckToJsType(type)
		};
	});
}

/** Rows of `DESCRIBE <stmt>` (column_name, column_type) → Evidence columns. */
export function columnsFromDescribe(rows: Record<string, unknown>[]): Column[] {
	return rows.map((r) => {
		const type = String(r.column_type ?? 'UNKNOWN');
		return {
			name: String(r.column_name),
			clickhouseType: type,
			jsType: getMotherduckToJsType(type),
			nullable: r.null === undefined ? undefined : r.null === 'YES'
		};
	});
}

/** Dataset name → SQL-friendly table name (lowercase snake_case). */
export function slugifyTableName(name: string): string {
	const slug = name
		.toLowerCase()
		.normalize('NFKD')
		// Drop the combining marks NFKD splits off accented letters (é → e).
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
	if (!slug) return 'dataset';
	return /^[0-9]/.test(slug) ? `_${slug}` : slug;
}
