/**
 * SQL Query execution for EVD CLI.
 *
 * If a connection.yaml exists at the project root, queries run directly
 * against the configured warehouse (currently Snowflake). Otherwise the
 * CLI falls back to the managed query engine via studio auth.
 */

import { loadCredentials, clearSessionCache, type StoredCredentials } from './storage.ts';
import { ensureSessionResolved, clearInMemorySessionCache } from './auth.ts';
import type { QueryOptions } from './args.ts';
import { readFile, writeFile } from 'fs/promises';
import {
	loadConnectionConfig,
	executeQuery as executeDirectQuery,
	type ConnectionConfig
} from './connection/index.ts';
import { printResult, renderResult, fail, type OutputOptions, type ResultData } from './output.ts';

/** Default row cap for `query` when neither --limit nor --all is given. */
const DEFAULT_QUERY_LIMIT = 1000;

// Query engine host - production URL
const QUERY_ENGINE_HOST =
	process.env.PUBLIC_QUERY_ENGINE_HOST || 'https://query-engine-service.evidence.studio';

interface QueryColumn {
	name: string;
	type: string;
	nullable?: boolean;
}

interface QueryResult {
	columns: QueryColumn[];
	rows: Record<string, unknown>[];
	error?: string;
}

interface QueryResponse {
	// Managed engine reports types as `clickhouseType`; direct path as `type`.
	columns?: Array<{ name: string; type?: string; clickhouseType?: string }>;
	rows?: Record<string, unknown>[];
	error?: string;
	message?: string;
}

/**
 * Read SQL from stdin
 */
async function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = '';
		process.stdin.setEncoding('utf8');

		// Check if stdin is a TTY (interactive terminal)
		if (process.stdin.isTTY) {
			reject(
				new Error('No SQL provided. Use a SQL string argument, --file, or pipe SQL via stdin.')
			);
			return;
		}

		process.stdin.on('data', (chunk) => {
			data += chunk;
		});

		process.stdin.on('end', () => {
			resolve(data.trim());
		});

		process.stdin.on('error', reject);

		// Set a timeout for stdin reading
		setTimeout(() => {
			if (!data) {
				reject(new Error('Timeout waiting for stdin input'));
			}
		}, 5000);
	});
}

/**
 * Get the SQL to execute from various sources
 */
async function getSql(options: QueryOptions): Promise<string> {
	// Priority: --file > positional arg > stdin
	if (options.file) {
		try {
			return (await readFile(options.file, 'utf-8')).trim();
		} catch (err) {
			throw new Error(`Failed to read SQL file: ${options.file}`);
		}
	}

	if (options.sql === '-') {
		return readStdin();
	}

	if (options.sql) {
		return options.sql;
	}

	// Try stdin if no other source
	return readStdin();
}

/**
 * Execute a SQL query against the query engine
 */
async function sendQuery(credentials: StoredCredentials, encodedSql: string): Promise<Response> {
	const url = `${QUERY_ENGINE_HOST}/v2/workspaces/${credentials.organizationId}/json`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	// Prefer APT cookie if available
	if (credentials.aptToken) {
		headers['Cookie'] = `studio-apt=${credentials.aptToken}`;
	} else if (credentials.sealedSession) {
		headers['Cookie'] = `wos-session=${credentials.sealedSession}`;
	} else {
		headers['Authorization'] = `Bearer ${credentials.accessToken}`;
	}

	return fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			query: encodedSql,
			queryWorkspaceData: true
		})
	});
}

async function executeDirect(sql: string, config: ConnectionConfig): Promise<QueryResult> {
	const result = await executeDirectQuery(sql, config);
	// Map { name, clickhouseType, jsType } → { name, type } for the CLI's
	// terminal-output formatters. Browser-side consumers (in /api/query) get
	// the richer shape directly.
	return {
		rows: result.rows,
		columns: result.columns.map((c) => ({
			name: c.name,
			type: c.clickhouseType,
			nullable: c.nullable
		}))
	};
}

async function executeQueryEngine(sql: string, limit: number | null): Promise<QueryResult> {
	// Apply limit once, regardless of warehouse mode.
	let finalSql = sql.trim();
	if (limit !== null) {
		finalSql = finalSql.replace(/;+$/, '');
		finalSql = `SELECT * FROM (${finalSql}) AS limited_query LIMIT ${limit}`;
	}

	// connection.yaml takes precedence — query the warehouse directly without
	// touching studio.
	const connectionConfig = await loadConnectionConfig(process.cwd());
	if (connectionConfig) {
		return executeDirect(finalSql, connectionConfig);
	}

	let credentials = await loadCredentials();

	if (!credentials) {
		throw new Error('Not authenticated. Run `evidence login` first.');
	}

	if (!credentials.organizationId) {
		throw new Error(
			'No organization selected. Run `evidence login` to authenticate with an organization.'
		);
	}

	credentials = await ensureSessionResolved(credentials);

	const encodedSql = Buffer.from(finalSql).toString('base64');

	let response = await sendQuery(credentials, encodedSql);

	// On auth failure, clear all stale session state and retry with a fresh one
	if (response.status === 401 || response.status === 403) {
		await clearSessionCache();
		clearInMemorySessionCache();
		credentials.sealedSession = undefined;
		credentials = await ensureSessionResolved(credentials);
		response = await sendQuery(credentials, encodedSql);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Query failed after session refresh (${response.status}): ${errorText}`);
		}
	}

	const responseText = await response.text();

	if (!response.ok) {
		let errorMessage = `Query failed (${response.status})`;
		try {
			const errorJson = JSON.parse(responseText);
			errorMessage = errorJson.message || errorJson.error || errorMessage;
		} catch {
			if (responseText) {
				errorMessage = responseText;
			}
		}
		throw new Error(errorMessage);
	}

	let result: QueryResponse;
	try {
		result = JSON.parse(responseText);
	} catch {
		throw new Error(`Invalid response from query engine: ${responseText}`);
	}

	if (result.error || result.message) {
		throw new Error(result.error || result.message);
	}

	return {
		// Normalize `clickhouseType` onto `type`, else describe/columns shows "unknown".
		// Nullable(...) is a positive signal only — proxied warehouse types don't carry nullability.
		columns: (result.columns || []).map((c) => {
			const type = c.type ?? c.clickhouseType ?? 'unknown';
			return {
				name: c.name,
				type,
				nullable: /^Nullable\(/.test(type) || undefined
			};
		}),
		rows: result.rows || []
	};
}

// ============================================================================
// Exported Query Function (for use by other commands)
// ============================================================================

export interface QueryResultData {
	columns: QueryColumn[];
	rows: Record<string, unknown>[];
}

/**
 * Execute a SQL query and return the result (without formatting/output)
 * Throws on error.
 */
export async function executeQuery(sql: string): Promise<QueryResultData> {
	return executeQueryEngine(sql, null);
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function runQuery(options: QueryOptions, opts: OutputOptions): Promise<void> {
	// Status chatter is for humans only — never pollute the machine-readable
	// stdout, and only show it under --verbose.
	const status = (msg: string) => {
		if (opts.verbose) console.error(msg);
	};

	try {
		// Get SQL from the appropriate source
		const sql = await getSql(options);

		if (!sql) {
			throw new Error('No SQL query provided');
		}

		// Cap rows by default so an unbounded query can't dump a huge result
		// set; --all removes the cap, --limit N overrides it.
		const effectiveLimit = opts.all ? null : (opts.limit ?? DEFAULT_QUERY_LIMIT);

		status(`  🔍 Executing query...`);

		const result = await executeQueryEngine(sql, effectiveLimit);

		status(`  ✅ Query returned ${result.rows.length} row(s)`);

		const truncated = effectiveLimit !== null && result.rows.length >= effectiveLimit;
		const data: ResultData = {
			kind: 'rows',
			columns: result.columns.map((c) => ({ name: c.name, type: c.type })),
			rows: result.rows,
			note: truncated ? `# truncated at ${effectiveLimit} rows (use --all)` : undefined
		};

		// The limit is already applied in SQL, so disable the output module's
		// defensive re-truncation (it would otherwise re-clip the note threshold).
		const outOpts: OutputOptions = { ...opts, limit: null, all: true };

		if (options.output) {
			// A file is never a terminal — keep it machine-readable regardless of the
			// invoking TTY. Explicit --format/--verbose still win.
			const fileOpts: OutputOptions = { ...outOpts, interactive: false };
			await writeFile(options.output, renderResult(data, fileOpts) + '\n');
			status(`  📁 Results written to ${options.output}`);
			if (data.note) console.error(data.note);
		} else {
			printResult(data, outOpts);
		}

		process.exit(0);
	} catch (err) {
		fail(err, opts);
	}
}
