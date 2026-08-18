/**
 * `evidence migrate [path] [--dry-run]` — convert an Evidence OSS project's
 * pages to Studio Markdoc syntax.
 *
 * Mechanical syntax conversion runs automatically; anything needing judgment
 * is printed as a note for a follow-up manual/AI pass. Finish with
 * `evidence validate` to catch what the converter can't know.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync, statSync, realpathSync } from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import yaml from 'js-yaml';
import {
	transformPage,
	convertInputRefs,
	rewriteSourceRefs,
	type MigrationNote
} from './transform.ts';
import { loadTagAttrs } from './schemas.ts';
import { migrateConnection } from './connection.ts';
import { loadProjectConfig, ProjectConfigError } from '../project-config/load-config.ts';
import { printResult, type OutputOptions } from '../output.ts';
import { VERSION } from '../args.ts';

/** package.json `name` unless it's the OSS template default, else the dir name. */
async function inferProjectName(projectRoot: string): Promise<string> {
	try {
		const pkg = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf-8'));
		if (typeof pkg.name === 'string' && pkg.name && pkg.name !== 'my-evidence-project') {
			return pkg.name;
		}
	} catch {
		// fall through to directory name
	}
	return path.basename(projectRoot);
}

/**
 * True when evidence.config.yaml positively carries OSS-only keys (`plugins:`
 * or `appearance:`) and no `project:` block. Absence of `project:` alone isn't
 * enough — a Studio config with the key missing or misspelled must surface its
 * validation error, not get silently replaced.
 */
async function isOssConfig(projectRoot: string): Promise<boolean> {
	let parsed: unknown;
	try {
		parsed = yaml.load(await readFile(path.join(projectRoot, 'evidence.config.yaml'), 'utf-8'));
	} catch {
		return false;
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
	if ('project' in parsed) return false;
	return 'plugins' in parsed || 'appearance' in parsed;
}

export interface MigrateOptions {
	output: OutputOptions;
	/** Migrate only this page (relative path within the pages dir). */
	path?: string;
	dryRun: boolean;
}

interface FileReport {
	path: string;
	changed: boolean;
	notes: MigrationNote[];
}

/**
 * collectFiles with symlink-resolved containment: entries whose real path
 * escapes `dir` are dropped, so a link inside the tree pointing elsewhere can
 * never route a later writeFile outside the project.
 */
async function collectContainedFiles(dir: string, extension: string): Promise<string[]> {
	const realDir = realpathSync(dir);
	return (await collectFiles(dir, extension)).filter((file) => {
		try {
			return realpathSync(file).startsWith(realDir + path.sep);
		} catch {
			return false;
		}
	});
}

async function collectFiles(dir: string, extension: string): Promise<string[]> {
	const out: string[] = [];
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await collectFiles(full, extension)));
		else if (entry.name.endsWith(extension)) out.push(full);
	}
	return out;
}

/** OSS project features with no Studio equivalent — surfaced once per run. */
function projectLevelNotes(projectRoot: string, pageFiles: string[]): MigrationNote[] {
	const notes: MigrationNote[] = [];
	if (existsSync(path.join(projectRoot, 'sources'))) {
		notes.push({
			level: 'warning',
			message:
				'`sources/` found: Studio does not run source SQL queries. Connect your warehouse (`evidence init --warehouse <type>` or configure a connection in Studio) and update table references.'
		});
	}
	if (existsSync(path.join(projectRoot, 'evidence.plugins.yaml'))) {
		notes.push({
			level: 'info',
			message: '`evidence.plugins.yaml` is not used by Studio — safe to delete after migrating.'
		});
	}
	for (const f of pageFiles) {
		const base = path.basename(f);
		if (/^\[.+\]\.md$/.test(base)) {
			notes.push({
				level: 'warning',
				message: `${base}: templated pages are not supported in Studio — replace with an input-driven page (e.g. a dropdown filtering the whole page).`
			});
		}
	}
	return notes;
}

async function findSvelteFiles(dir: string): Promise<string[]> {
	if (!existsSync(dir)) return [];
	const out: string[] = [];
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await findSvelteFiles(full)));
		else if (entry.name.endsWith('.svelte')) out.push(full);
	}
	return out;
}

export async function migrate(options: MigrateOptions): Promise<void> {
	const projectRoot = process.cwd();
	const configNotes: MigrationNote[] = [];
	let pagesDir = path.join(projectRoot, 'pages');
	try {
		const config = await loadProjectConfig(projectRoot);
		pagesDir = config.pagesDir;
	} catch (err) {
		// OSS projects use the same evidence.config.yaml filename with an
		// incompatible shape (plugins/appearance) — rewrite it in the new format
		// so every later command (dev, validate) stops erroring on load.
		if (!(err instanceof ProjectConfigError)) throw err;
		// A ProjectConfigError also covers unreadable/malformed YAML and broken
		// Studio configs, where rewriting would silently destroy settings.
		if (!(await isOssConfig(projectRoot))) {
			console.error(`  ✖ ${(err as Error).message}`);
			console.error('    Fix evidence.config.yaml (or delete it) and re-run `evidence migrate`.');
			process.exit(1);
		}
		if (options.dryRun) {
			configNotes.push({
				level: 'info',
				message:
					'`evidence.config.yaml` is in the OSS format — would be rewritten in the Studio format.'
			});
		} else {
			const name = await inferProjectName(projectRoot);
			// JSON string = valid YAML double-quoted scalar; keeps a name with
			// quotes/newlines from reshaping the generated document.
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: ${JSON.stringify(name)}\n  evidence: "${VERSION}"\n\npages: ./pages\n`,
				'utf-8'
			);
			configNotes.push({
				level: 'info',
				message: `\`evidence.config.yaml\` was in the OSS format — rewritten in the Studio format (project name: "${name}").`
			});
		}
	}

	if (!existsSync(pagesDir)) {
		console.error(`  ✖ No pages directory found at ${pagesDir}`);
		process.exit(1);
	}

	let files: string[];
	if (options.path) {
		const target = path.resolve(pagesDir, options.path);
		if (!existsSync(target)) {
			console.error(`  ✖ Page not found: ${target}`);
			process.exit(1);
		}
		// Containment is checked on the real (symlink-resolved) path — a link
		// inside pages/ pointing elsewhere must not let migrate write outside it.
		const realTarget = realpathSync(target);
		const realPagesDir = realpathSync(pagesDir);
		if (!realTarget.startsWith(realPagesDir + path.sep)) {
			console.error(`  ✖ Page must be inside the pages directory (${pagesDir}): ${options.path}`);
			process.exit(1);
		}
		if (!statSync(realTarget).isFile() || !realTarget.endsWith('.md')) {
			console.error(`  ✖ Not a markdown page: ${target}`);
			process.exit(1);
		}
		files = [realTarget];
	} else {
		files = await collectContainedFiles(pagesDir, '.md');
	}

	// Connection conversion runs first so its source→queries table map can be
	// rewritten into page SQL below.
	const connection = options.path
		? { notes: [] as MigrationNote[], sourceRefs: new Map<string, string>() }
		: await migrateConnection(projectRoot, options.dryRun);

	// Project-wide SQL files (queries/**/*.sql) resolve by path in studio, so
	// bare-name references to them get rewritten even without a frontmatter
	// `queries:` declaration.
	const projectQueryFiles = new Map<string, string>();
	const projectQueriesDir = path.join(projectRoot, 'queries');
	if (existsSync(projectQueriesDir)) {
		for (const file of await collectContainedFiles(projectQueriesDir, '.sql')) {
			const rel = path
				.relative(projectRoot, file)
				.replaceAll('\\', '/')
				.replace(/\.sql$/, '');
			projectQueryFiles.set(path.basename(rel), rel);
		}
	}

	const tagAttrs = await loadTagAttrs();
	const reports: FileReport[] = [];
	for (const file of files) {
		const source = await readFile(file, 'utf-8');
		const result = transformPage(source, {
			tagAttrs,
			sourceRefs: connection.sourceRefs,
			queryFiles: projectQueryFiles
		});
		if (result.changed && !options.dryRun) {
			await writeFile(file, result.content, 'utf-8');
		}
		reports.push({
			path: path.relative(projectRoot, file),
			changed: result.changed,
			notes: result.notes
		});
	}

	// Studio reads project .sql files (e.g. queries/orders) — migrate their
	// contents too: only the input-reference syntax differs from OSS.
	if (!options.path) {
		const queriesDir = path.join(projectRoot, 'queries');
		if (existsSync(queriesDir)) {
			for (const file of await collectContainedFiles(queriesDir, '.sql')) {
				const source = await readFile(file, 'utf-8');
				const notes: MigrationNote[] = [];
				const content = rewriteSourceRefs(
					convertInputRefs(source, notes, projectQueryFiles, 'sql-file'),
					connection.sourceRefs,
					notes
				);
				const changed = content !== source;
				if (changed && !options.dryRun) await writeFile(file, content, 'utf-8');
				reports.push({ path: path.relative(projectRoot, file), changed, notes });
			}
		}
	}

	const projectNotes = [
		...configNotes,
		...projectLevelNotes(projectRoot, files),
		...connection.notes
	];
	const svelteFiles = await findSvelteFiles(pagesDir);
	for (const f of svelteFiles) {
		projectNotes.push({
			level: 'warning',
			message: `${path.relative(projectRoot, f)}: Svelte files are not supported in Studio — port the content into a page or delete.`
		});
	}

	const structured = {
		dryRun: options.dryRun,
		fileCount: reports.length,
		changedCount: reports.filter((r) => r.changed).length,
		files: reports,
		projectNotes
	};

	if (options.output.format === 'json' || options.output.format === 'ndjson') {
		printResult({ kind: 'structured', value: structured }, options.output);
		return;
	}

	// Human report
	console.log('');
	for (const report of reports) {
		if (!report.changed && report.notes.length === 0) continue;
		const marker = report.changed ? pc.green('✔') : pc.dim('·');
		const action = options.dryRun ? 'would convert' : 'converted';
		console.log(`  ${marker} ${report.path}${report.changed ? pc.dim(` — ${action}`) : ''}`);
		for (const note of report.notes) {
			const icon = note.level === 'warning' ? pc.yellow('⚠') : pc.dim('ℹ');
			console.log(`      ${icon} ${note.message}`);
		}
	}
	const untouched = reports.filter((r) => !r.changed && r.notes.length === 0).length;
	if (untouched > 0) console.log(pc.dim(`  · ${untouched} file(s) already clean`));

	if (projectNotes.length > 0) {
		console.log('');
		console.log('  Project:');
		for (const note of projectNotes) {
			const icon = note.level === 'warning' ? pc.yellow('⚠') : pc.dim('ℹ');
			console.log(`    ${icon} ${note.message}`);
		}
	}

	console.log('');
	console.log(
		`  ${structured.changedCount}/${structured.fileCount} file(s) ${options.dryRun ? 'need conversion' : 'converted'}.`
	);
	if (!options.dryRun && structured.changedCount > 0) {
		console.log(pc.dim('  Next: run `evidence validate` to check the converted pages.'));
	}
	console.log('');
}
