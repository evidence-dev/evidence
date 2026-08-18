import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Session } from 'chdb';

let session: Session | undefined;

// chdb allows one engine per process, so the stateless helper and the fixture share a session.
function clickhouse(): Session {
	if (!session) {
		session = new Session(join(tmpdir(), `evidence-chdb-${process.pid}`));
		session.query(`CREATE DATABASE IF NOT EXISTS demo`);
		session.query(
			`CREATE TABLE IF NOT EXISTS demo.daily_orders (category String, region String, date DateTime, total_sales Float64, transactions Int64, total Float64, unit_price Float64) ENGINE = MergeTree ORDER BY tuple()`
		);
		session.query(
			`INSERT INTO demo.daily_orders VALUES ('Shoes','East','2025-01-02 09:00:00',120,4,120,30),('Home','West','2025-02-03 10:00:00',80,2,80,40)`
		);
		process.once('exit', () => session?.cleanup());
	}
	return session;
}

export function assertParses(sql: string): void {
	try {
		clickhouse().query(`EXPLAIN SYNTAX ${sql}`, 'TabSeparated');
	} catch (error) {
		throw new Error(`ClickHouse parse failure: ${reason(error)}\n---\n${sql}\n---`);
	}
}

/** Parse-check a SELECT-list expression by wrapping it in `SELECT <expr>`. */
export function assertExprParses(expr: string): void {
	assertParses(`SELECT ${expr}`);
}

export function queryClickHouse(sql: string): string {
	return String(clickhouse().query(sql, 'TabSeparated'));
}

/** Grouping mistakes parse cleanly and only fail once ClickHouse resolves the columns. */
export function assertRuns(sql: string): void {
	try {
		queryClickHouse(sql);
	} catch (error) {
		throw new Error(`ClickHouse rejected the query: ${reason(error)}\n---\n${sql}\n---`);
	}
}

function reason(error: unknown): string {
	return (error as Error).message.split('. In query')[0];
}
