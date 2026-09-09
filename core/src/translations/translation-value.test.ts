import { describe, it, expect } from 'vitest';
import {
	TranslationValue,
	wrapTranslationsForSql,
	applyTranslationSqlEscapes,
	hasUnresolvedTranslationSqlEscape
} from './translation-value';
import { PostgresDialect } from '../sql-dialect/postgres';
import { BigQueryDialect } from '../sql-dialect/bigquery';
import { DatabricksDialect } from '../sql-dialect/databricks';
import { ClickHouseDialect } from '../sql-dialect/clickhouse';
import { SnowflakeDialect } from '../sql-dialect/snowflake';

describe('TranslationValue', () => {
	it('exposes the raw text via String() (bare interpolation stays unchanged)', () => {
		const t = new TranslationValue("Chiffre d'affaires");
		expect(String(t)).toBe("Chiffre d'affaires");
		expect(`${t}`).toBe("Chiffre d'affaires");
	});

	it('is instanceof String so downstream String consumers still work', () => {
		expect(new TranslationValue('foo')).toBeInstanceOf(String);
	});

	it('.sql emits a sentinel, not a pre-escaped literal (escape happens per-dialect)', () => {
		const out = new TranslationValue("d'adhérents").sql;
		expect(out).not.toContain("''");
		expect(hasUnresolvedTranslationSqlEscape(out)).toBe(true);
	});

	it('serializes as its primitive string via JSON.stringify (transport is transparent)', () => {
		expect(JSON.stringify({ foo: new TranslationValue("d'affaires") })).toBe(
			'{"foo":"d\'affaires"}'
		);
	});
});

describe('wrapTranslationsForSql', () => {
	it('wraps flat string leaves', () => {
		const out = wrapTranslationsForSql({ greeting: "Bonjour d'ami" }) as unknown as Record<
			string,
			TranslationValue
		>;
		expect(out.greeting).toBeInstanceOf(TranslationValue);
		expect(String(out.greeting)).toBe("Bonjour d'ami");
	});

	it('recurses into nested objects', () => {
		const out = wrapTranslationsForSql({
			messages: { welcome: "L'accueil", farewell: 'Au revoir' }
		}) as unknown as { messages: Record<string, TranslationValue> };
		expect(out.messages.welcome).toBeInstanceOf(TranslationValue);
		expect(String(out.messages.welcome)).toBe("L'accueil");
		expect(String(out.messages.farewell)).toBe('Au revoir');
	});

	it('is idempotent on an already-wrapped map (guards against Object.entries-on-String)', () => {
		const once = wrapTranslationsForSql({ greeting: "d'ami" });
		const twice = wrapTranslationsForSql(once) as unknown as Record<string, TranslationValue>;
		expect(String(twice.greeting)).toBe("d'ami");
	});

	it('accepts an empty map', () => {
		expect(wrapTranslationsForSql({})).toEqual({});
	});
});

describe('applyTranslationSqlEscapes', () => {
	// Round-trip: wrapping + `.sql` + apply must produce SQL the target dialect
	// accepts inside a `'…'` literal — that's the whole point of the sentinel.
	const dialects = {
		postgres: new PostgresDialect(),
		bigquery: new BigQueryDialect(),
		databricks: new DatabricksDialect(),
		clickhouse: new ClickHouseDialect(),
		snowflake: new SnowflakeDialect()
	} as const;

	const wrapped = (v: string) => new TranslationValue(v).sql;
	const surround = (payload: string) => `WHERE section = '${payload}'`;

	it('is a no-op on strings with no sentinel', () => {
		const sql = "SELECT '''foo'''";
		expect(applyTranslationSqlEscapes(sql, dialects.postgres)).toBe(sql);
		expect(applyTranslationSqlEscapes(sql)).toBe(sql);
	});

	it('escapes plain apostrophes for an ANSI dialect (Postgres)', () => {
		const sql = surround(wrapped("Offre d'adhérents"));
		expect(applyTranslationSqlEscapes(sql, dialects.postgres)).toBe(
			"WHERE section = 'Offre d''adhérents'"
		);
	});

	it('escapes plain apostrophes for a backslash dialect (BigQuery / Databricks)', () => {
		// BigQuery + Databricks use `\'` for apostrophes — `''` is not accepted
		// (BQ rejects it, older Spark concatenates). The sentinel lets the
		// dialect pick the right escape at render time.
		const sql = surround(wrapped("Offre d'adhérents"));
		expect(applyTranslationSqlEscapes(sql, dialects.bigquery)).toBe(
			"WHERE section = 'Offre d\\'adhérents'"
		);
		expect(applyTranslationSqlEscapes(sql, dialects.databricks)).toBe(
			"WHERE section = 'Offre d\\'adhérents'"
		);
	});

	it('escapes backslash-containing values correctly per dialect (P1 in review)', () => {
		// A translation containing an ASCII backslash — rare, but the reviewer
		// (correctly) flagged the naive `.replace(/'/g,"''")` failure mode:
		// on a backslash dialect the `\` escapes the first doubled quote and
		// the second quote closes the literal early.
		const sql = surround(wrapped("O\\'Reilly"));
		expect(applyTranslationSqlEscapes(sql, dialects.postgres)).toBe(
			"WHERE section = 'O\\''Reilly'"
		);
		expect(applyTranslationSqlEscapes(sql, dialects.bigquery)).toBe(
			"WHERE section = 'O\\\\\\'Reilly'"
		);
		expect(applyTranslationSqlEscapes(sql, dialects.clickhouse)).toBe(
			"WHERE section = 'O\\\\\\'Reilly'"
		);
		expect(applyTranslationSqlEscapes(sql, dialects.snowflake)).toBe(
			"WHERE section = 'O\\\\\\'Reilly'"
		);
	});

	it('falls back to ANSI escaping when no dialect is passed (safety net)', () => {
		const sql = surround(wrapped("d'affaires"));
		expect(applyTranslationSqlEscapes(sql)).toBe("WHERE section = 'd''affaires'");
	});

	it('handles multiple sentinels in one query', () => {
		const sql = `SELECT '${wrapped("l'un")}', '${wrapped("l'autre")}'`;
		expect(applyTranslationSqlEscapes(sql, dialects.postgres)).toBe(
			"SELECT 'l''un', 'l''autre'"
		);
	});

	it('leaves a value containing the CLOSE marker intact (length-prefix survives collisions)', () => {
		const pathological = 'x\uE002ev-tsql\uE003y';
		const sql = `'${wrapped(pathological)}'`;
		expect(applyTranslationSqlEscapes(sql, dialects.postgres)).toBe(`'${pathological}'`);
	});

	it('leaves a malformed sentinel-looking substring alone without infinite-looping', () => {
		const junk = `${'\uE000ev-tsql\uE001'}not-a-length-prefix`;
		expect(applyTranslationSqlEscapes(junk, dialects.postgres)).toBe(junk);
	});
});
