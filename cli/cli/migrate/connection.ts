/**
 * Legacy source connection → root connection.yaml conversion.
 *
 * Legacy Evidence keeps per-source `sources/<name>/connection.yaml` (public fields) +
 * `connection.options.yaml` (base64-encoded secrets). The Core CLI reads one
 * dbt-style `connection.yaml` at the project root with plain values. This
 * converts the first supported source and flags the rest.
 */

import { readFile, writeFile, readdir, appendFile, mkdir, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { CONNECTION_TYPES } from '@evidence/core/connectors/connection-schema';
import type { MigrationNote } from './transform.ts';

const SUPPORTED_TYPES = new Set([
	'bigquery',
	'snowflake',
	'clickhouse',
	'databricks',
	'postgres',
	'motherduck'
]);

/** Every type the Core CLI's connection.yaml accepts — an existing file with
 * one of these is a working Core config and must never be replaced. */
const CORE_CONNECTION_TYPES = new Set<string>(CONNECTION_TYPES);

interface OssSource {
	dir: string;
	name: string;
	type: string;
	options: Record<string, unknown>;
}

// Legacy Evidence base64-encodes every string in connection.options.yaml.
function decodeBase64Values(obj: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(obj).map(([k, v]) =>
			typeof v === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(v)
				? [k, Buffer.from(v, 'base64').toString('utf-8')]
				: [k, v]
		)
	);
}

/** Read a file inside `dir`, refusing symlinks whose target escapes it. */
async function containedRead(dir: string, name: string): Promise<string | null> {
	const filePath = path.join(dir, name);
	if (!existsSync(filePath)) return null;
	try {
		const real = await realpath(filePath);
		if (!real.startsWith((await realpath(dir)) + path.sep)) return null;
		return await readFile(real, 'utf-8');
	} catch {
		return null;
	}
}

async function readOssSource(dir: string): Promise<OssSource | null> {
	const connRaw = await containedRead(dir, 'connection.yaml');
	if (connRaw === null) return null;
	const conn = yaml.load(connRaw) as Record<string, unknown> | null;
	if (!conn || typeof conn.type !== 'string') return null;
	let options = (conn.options as Record<string, unknown>) ?? {};
	const optionsRaw = await containedRead(dir, 'connection.options.yaml');
	if (optionsRaw !== null) {
		const secretOptions = yaml.load(optionsRaw) as Record<string, unknown> | null;
		if (secretOptions) options = { ...options, ...decodeBase64Values(secretOptions) };
	}
	// The name becomes a queries/ subdirectory and reference prefix — anything
	// but a plain identifier (e.g. traversal segments) falls back to the
	// source's real directory name.
	const rawName = String(conn.name ?? path.basename(dir));
	const name = /^[\w-]+$/.test(rawName) ? rawName : path.basename(dir);
	return { dir, name, type: conn.type, options };
}

/**
 * The source dir's .sql files, symlink-safe: entries whose real path escapes
 * the directory (or that aren't regular files) are skipped, so a planted link
 * can't pull external file contents into the migration.
 */
async function containedSqlFiles(sourceDir: string): Promise<string[]> {
	const realDir = await realpath(sourceDir);
	const out: string[] = [];
	for (const entry of await readdir(sourceDir)) {
		if (!entry.endsWith('.sql')) continue;
		try {
			const real = await realpath(path.join(sourceDir, entry));
			if (real.startsWith(realDir + path.sep)) out.push(entry);
		} catch {
			// broken link — skip
		}
	}
	return out;
}

/** Dataset names referenced as `project.dataset.table` in the source's SQL. */
async function scanBigQueryDatasets(sourceDir: string): Promise<string[]> {
	const datasets = new Set<string>();
	for (const entry of await containedSqlFiles(sourceDir)) {
		const sql = await readFile(path.join(sourceDir, entry), 'utf-8');
		for (const m of sql.matchAll(/(?:from|join)\s+`?[\w-]+`?\.`?([\w-]+)`?\.`?[\w-]+/gi)) {
			datasets.add(m[1]);
		}
	}
	return [...datasets].sort();
}

async function buildNewConnection(
	source: OssSource,
	notes: MigrationNote[]
): Promise<Record<string, unknown>> {
	const o = source.options;
	if (source.type === 'bigquery') {
		const datasets = await scanBigQueryDatasets(source.dir);
		if (datasets.length === 0) {
			notes.push({
				level: 'warning',
				message:
					'connection.yaml: could not infer BigQuery datasets from source SQL — fill in the `datasets:` allowlist manually.'
			});
		}
		return {
			type: 'bigquery',
			project: o.project ?? o.project_id,
			keyfile_json: { client_email: o.client_email, private_key: o.private_key },
			...(o.location ? { location: o.location } : {}),
			...(datasets.length > 0 ? { datasets } : { datasets: ['<dataset>'] })
		};
	}
	// Other supported warehouses: legacy option keys mostly match the new
	// top-level fields — carry them over and let validation flag the rest.
	notes.push({
		level: 'info',
		message: `connection.yaml: ${source.type} options copied as-is — verify field names against \`evidence init --warehouse ${source.type}\`.`
	});
	return { type: source.type, ...o };
}

export interface ConnectionMigrationResult {
	written: boolean;
	notes: MigrationNote[];
	/** `source.table` → `{{ /queries/source/table }}` rewrites for page SQL. */
	sourceRefs: Map<string, string>;
}

export async function migrateConnection(
	projectRoot: string,
	dryRun: boolean
): Promise<ConnectionMigrationResult> {
	const notes: MigrationNote[] = [];
	const sourceRefs = new Map<string, string>();
	const sourcesDir = path.join(projectRoot, 'sources');
	if (!existsSync(sourcesDir)) return { written: false, notes, sourceRefs };

	const sources: OssSource[] = [];
	for (const entry of await readdir(sourcesDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const source = await readOssSource(path.join(sourcesDir, entry.name));
		if (source) sources.push(source);
	}
	if (sources.length === 0) return { written: false, notes, sourceRefs };

	const supported = sources.filter((s) => SUPPORTED_TYPES.has(s.type));
	for (const s of sources.filter((s) => !SUPPORTED_TYPES.has(s.type))) {
		notes.push({
			level: 'warning',
			message: `source \`${s.name}\` (type: ${s.type}) has no direct connector — configure it in Evidence Studio (or drop it) and update queries that reference it.`
		});
	}
	if (supported.length === 0) return { written: false, notes, sourceRefs };

	const [chosen, ...rest] = supported;
	for (const s of rest) {
		notes.push({
			level: 'warning',
			message: `source \`${s.name}\` (type: ${s.type}) skipped — the CLI supports one root connection.yaml; connect extra sources in Evidence Studio.`
		});
	}

	const target = path.join(projectRoot, 'connection.yaml');
	// An existing root config that already parses as a Core connection
	// (recognized `type:`) is the user's working setup — never replace it.
	// Only a missing or non-Core-shaped file gets (re)written.
	if (existsSync(target)) {
		let existing: unknown;
		try {
			existing = yaml.load(await readFile(target, 'utf-8'));
		} catch {
			existing = null;
		}
		const existingType =
			existing && typeof existing === 'object' && 'type' in existing
				? String((existing as Record<string, unknown>).type)
				: null;
		if (existingType && CORE_CONNECTION_TYPES.has(existingType)) {
			notes.push({
				level: 'info',
				message: `existing connection.yaml (${existingType}) kept — delete it and re-run \`evidence migrate\` to regenerate from source \`${chosen.name}\`.`
			});
			return finishWithQueries(projectRoot, chosen, notes, sourceRefs, dryRun);
		}
	}
	const config = await buildNewConnection(chosen, notes);
	const replacing = existsSync(target);
	notes.push({
		level: replacing ? 'warning' : 'info',
		message: `connection.yaml ${dryRun ? 'would be written' : 'written'} from source \`${chosen.name}\` (${chosen.type})${replacing ? ` — this ${dryRun ? 'would replace' : 'replaced'} the existing non-Core-format ${path.basename(target)}; back it up first` : ''}.`
	});

	if (!dryRun) {
		await writeFile(target, yaml.dump(config, { lineWidth: -1 }), 'utf-8');
		// The file holds plain credentials — keep it out of git.
		const gitignorePath = path.join(projectRoot, '.gitignore');
		if (existsSync(gitignorePath)) {
			const gitignore = await readFile(gitignorePath, 'utf-8');
			const ignored = gitignore
				.split('\n')
				.some((l) => l.trim() === 'connection.yaml' || l.trim() === '/connection.yaml');
			if (!ignored) {
				await appendFile(gitignorePath, '\nconnection.yaml\n');
				notes.push({
					level: 'info',
					message: 'added connection.yaml to .gitignore (it contains credentials).'
				});
			}
		} else {
			notes.push({
				level: 'warning',
				message:
					'no .gitignore found — make sure connection.yaml (contains credentials) is not committed.'
			});
		}
	}

	return finishWithQueries(projectRoot, chosen, notes, sourceRefs, dryRun);
}

/**
 * Legacy source queries ran on the warehouse — they stay valid SQL. Copy them
 * to queries/<source>/ so pages can reference them as {{ /queries/... }}.
 * Runs whether or not connection.yaml was (re)written.
 */
async function finishWithQueries(
	projectRoot: string,
	chosen: OssSource,
	notes: MigrationNote[],
	sourceRefs: Map<string, string>,
	dryRun: boolean
): Promise<ConnectionMigrationResult> {
	const sqlFiles = await containedSqlFiles(chosen.dir);
	if (sqlFiles.length > 0) {
		const queriesTarget = path.join(projectRoot, 'queries', chosen.name);
		if (!dryRun) await mkdir(queriesTarget, { recursive: true });
		let copied = 0;
		const skipped: string[] = [];
		for (const file of sqlFiles) {
			const stem = file.replace(/\.sql$/, '');
			// A page reference resolves to the same path either way, so map it
			// even when an existing file is left in place.
			sourceRefs.set(`${chosen.name}.${stem}`, `{{ /queries/${chosen.name}/${stem} }}`);
			const destination = path.join(queriesTarget, file);
			// Never clobber query SQL the user already wrote here.
			if (existsSync(destination)) {
				skipped.push(file);
				continue;
			}
			copied++;
			if (!dryRun) {
				await writeFile(destination, await readFile(path.join(chosen.dir, file), 'utf-8'), 'utf-8');
			}
		}
		if (copied > 0) {
			notes.push({
				level: 'info',
				message: `${dryRun ? 'would copy' : 'copied'} ${copied} source SQL file(s) from sources/${path.basename(chosen.dir)} to queries/${chosen.name}/ — pages reference them as {{ /queries/${chosen.name}/<name> }}.`
			});
		}
		if (skipped.length > 0) {
			notes.push({
				level: 'warning',
				message: `queries/${chosen.name}/: left ${skipped.length} existing file(s) untouched (${skipped.join(', ')}) — merge them with the source SQL by hand if needed.`
			});
		}
	}

	return { written: true, notes, sourceRefs };
}
