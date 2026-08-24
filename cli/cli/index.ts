/**
 * Evidence CLI Entry Point
 * This file is compiled into the binary.
 */

import path from 'node:path';
import { existsSync } from 'node:fs';
import { parseArgs, showHelp, showVersion, showDefault, BANNER, VERSION } from './args.ts';
import {
	login,
	logout,
	whoami,
	listOrgs,
	switchOrg,
	getAuthStatus,
	generateToken
} from './auth.ts';
import { runQuery, executeQuery } from './query.ts';
import { loadConnectionConfig, listTablesSql, qualifyTableName } from './connection/index.ts';
import { managedColumnsSql, NO_QUERY_CACHE } from '@evidence/core/metadata/managed-catalog';
import { printResult, fail, EXIT_USAGE } from './output.ts';
import { listConnectors } from './connectors.ts';
import { listModelsCommand } from './models.ts';
import { lineageCommand } from './lineage.ts';
import { validate } from './validate.ts';
import { migrate } from './migrate/migrate.ts';
import { docs } from './docs.ts';
import { upgrade } from './upgrade.ts';
import { startupVersionCheck } from './version-check.ts';
import { track } from './telemetry.ts';
import { runInit } from './init/init.ts';
import { launch } from './launch.ts';
import { link } from './link.ts';
import { unlink } from './unlink.ts';
import { signup } from './signup.ts';

// ============================================================================
// Main
// ============================================================================

// A project with connection.yaml queries its warehouse directly and never hits
// the managed query engine, so it needs no login. Mirrors getProjectCwd(); a
// raw existence check (not loadConnectionConfig) keeps a broken file from
// blocking dev — it's reported at query time instead.
function hasConnectionYaml(): boolean {
	const cwd = process.env.EVIDENCE_PROJECT_CWD || process.cwd();
	return existsSync(path.join(cwd, 'connection.yaml'));
}

const args = parseArgs();

// --project <path> changes the effective project directory for everything
// downstream (loadConnectionConfig calls, SvelteKit server-side cwd reads,
// child processes spawned for `evidence dev`).
if (args.project) {
	const resolved = path.resolve(args.project);
	try {
		process.chdir(resolved);
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code;
		if (code === 'ENOENT') {
			console.error(`Error: --project path does not exist: ${resolved}`);
		} else if (code === 'ENOTDIR') {
			console.error(`Error: --project path is not a directory: ${resolved}`);
		} else {
			console.error(
				`Error: could not change to --project path ${resolved}: ${err instanceof Error ? err.message : err}`
			);
		}
		process.exit(1);
	}
	process.env.EVIDENCE_PROJECT_CWD = resolved;
}

const startupTasks: Promise<unknown>[] = [track('cli_command', { command: args.command })];
const skipVersionCheck = ['version', 'upgrade', 'help', 'init'];
if (!skipVersionCheck.includes(args.command)) {
	startupTasks.push(startupVersionCheck());
}
await Promise.all(startupTasks);

try {
	switch (args.command) {
		case 'default':
			showDefault(await getAuthStatus());
			process.exit(0);
			break;

		case 'help':
			showHelp();
			process.exit(0);
			break;

		case 'version':
			// Bare version string by default; structured under --format json/ndjson.
			// (There is no separate "schema" version in the product yet, so only
			// `cli` is reported.)
			if (args.output.format === 'json' || args.output.format === 'ndjson') {
				printResult({ kind: 'structured', value: { cli: VERSION } }, args.output);
			} else {
				showVersion();
			}
			process.exit(0);
			break;

		case 'init': {
			const result = await runInit({
				targetDir: args.initTargetDir,
				cwd: process.cwd(),
				force: args.initForce,
				warehouse: args.initWarehouse
			});
			const relative = path.relative(process.cwd(), result.projectRoot) || '.';
			console.log(`Created Evidence project at ${relative}`);
			console.log('');
			console.log('Next steps:');
			if (result.createdDirectory) console.log(`  cd ${args.initTargetDir}`);
			if (result.warehouse) {
				console.log(`  Add your ${result.warehouse} credentials to connection.yaml`);
			}
			console.log('  evidence dev');
			process.exit(0);
			break;
		}

		case 'login':
			await login();
			process.exit(0);
			break;

		case 'signup':
			await signup();
			process.exit(0);
			break;

		case 'logout':
			await logout();
			process.exit(0);
			break;

		case 'whoami':
			await whoami(args.output);
			process.exit(0);
			break;

		case 'orgs':
			await listOrgs();
			process.exit(0);
			break;

		case 'token':
			await generateToken();
			process.exit(0);
			break;

		case 'switch':
			if (!args.orgIdentifier) {
				console.error('Usage: evidence switch <organization name or id>');
				console.error('Example: evidence switch "My Organization"');
				console.error('\nRun `evidence orgs` to see available organizations.');
				process.exit(1);
			}
			await switchOrg(args.orgIdentifier);
			process.exit(0);
			break;

		case 'query':
			await runQuery(args.query, args.output);
			// runQuery handles exit codes
			break;

		case 'tables': {
			// List available tables — warehouse-specific (BQ has no SHOW TABLES).
			try {
				const cfg = await loadConnectionConfig(process.cwd());
				const result = await executeQuery(listTablesSql(cfg));

				// The full column set (name/schema/rows/kind) is gated behind
				// --verbose/--all; the default is a plain `schema.table` name list.
				if (args.output.verbose || args.output.all) {
					const rows = result.rows.map((r) => ({
						name: r.name ?? null,
						schema: r.schema_name ?? r.table_schema ?? null,
						rows: r.rows ?? null,
						kind: r.kind ?? null
					}));
					printResult(
						{
							kind: 'rows',
							columns: [{ name: 'name' }, { name: 'schema' }, { name: 'rows' }, { name: 'kind' }],
							rows
						},
						args.output
					);
				} else {
					const names = result.rows
						.map((r) => {
							const schema = (r.schema_name ?? r.table_schema) as string | undefined;
							const name = String(r.name);
							return schema ? `${schema}.${name}` : name;
						})
						.sort((a, b) => a.localeCompare(b));
					printResult({ kind: 'name-list', names }, args.output);
				}
				process.exit(0);
			} catch (err) {
				fail(err, args.output);
			}
			break;
		}

		case 'describe': {
			if (!args.tableName) {
				console.error('Usage: evidence describe <table_name>');
				console.error('Example: evidence describe demo_daily_orders');
				process.exit(EXIT_USAGE);
			}
			try {
				const cfg = await loadConnectionConfig(process.cwd());
				const result = await executeQuery(
					`SELECT * FROM ${qualifyTableName(args.tableName, cfg)} LIMIT 1`
				);
				// null = source didn't report nullability (e.g. proxied engine types).
				const rows = result.columns.map((c) => ({
					name: c.name,
					type: c.type || 'unknown',
					nullable: c.nullable ?? null
				}));
				printResult(
					{
						kind: 'rows',
						columns: [{ name: 'name' }, { name: 'type' }, { name: 'nullable' }],
						rows
					},
					args.output
				);
				process.exit(0);
			} catch (err) {
				fail(err, args.output);
			}
			break;
		}

		case 'schema':
			try {
				const cfg = await loadConnectionConfig(process.cwd());

				// --table narrows to a single table's column list (like describe).
				if (args.schemaTable) {
					const result = await executeQuery(
						`SELECT * FROM ${qualifyTableName(args.schemaTable, cfg)} LIMIT 1`
					);
					const rows = result.columns.map((c) => ({ name: c.name, type: c.type || 'unknown' }));
					printResult(
						{ kind: 'rows', columns: [{ name: 'name' }, { name: 'type' }], rows },
						args.output
					);
					process.exit(0);
				}

				// Default: one row per table with its column count.
				let summary: { schema: string | null; table: string; columns: number }[];

				if (!cfg) {
					// One catalog query instead of an N+1 `SELECT * LIMIT 1` per table.
					const catalog = await executeQuery(`${managedColumnsSql()} ${NO_QUERY_CACHE}`);
					const counts = new Map<string, number>();
					for (const row of catalog.rows) {
						const table = String(row.tableName);
						counts.set(table, (counts.get(table) ?? 0) + 1);
					}
					summary = [...counts.entries()]
						.sort((a, b) => a[0].localeCompare(b[0]))
						.map(([table, columns]) => ({ schema: null, table, columns }));
				} else {
					const tablesResult = await executeQuery(listTablesSql(cfg));
					summary = [];
					for (const r of tablesResult.rows) {
						const table = String(r.name);
						const schema = (r.schema_name ?? r.table_schema ?? null) as string | null;
						let columns = 0;
						try {
							const colResult = await executeQuery(
								`SELECT * FROM ${qualifyTableName(table, cfg, schema)} LIMIT 1`
							);
							columns = colResult.columns.length;
						} catch {
							columns = 0;
						}
						summary.push({ schema, table, columns });
					}
				}

				printResult(
					{
						kind: 'rows',
						columns: [{ name: 'schema' }, { name: 'table' }, { name: 'columns' }],
						rows: summary as unknown as Record<string, unknown>[]
					},
					args.output
				);
				process.exit(0);
			} catch (err) {
				fail(err, args.output);
			}
			break;

		case 'connectors':
			await listConnectors(args.output);
			break;

		case 'models':
			await listModelsCommand(args.output);
			break;

		case 'lineage':
			await lineageCommand(args.lineageArgs, {
				...args.output,
				branch: args.lineageBranch ?? undefined
			});
			break;

		case 'validate':
			await validate({ output: args.output, path: args.validatePath ?? undefined });
			break;

		case 'migrate':
			await migrate({
				output: args.output,
				path: args.migratePath ?? undefined,
				dryRun: args.migrateDryRun
			});
			break;

		case 'docs':
			await docs(args.docsSubcommand ?? '', args.docsArgs, args.output);
			break;

		case 'upgrade':
			await upgrade();
			process.exit(0);
			break;

		case 'publish':
			console.log(BANNER);
			console.log('  `evidence publish` is deprecated. Evidence deploys from your Git repo now.\n');
			console.log(
				'    1. evidence launch                     connect this project to Studio + GitHub (once)'
			);
			console.log('    2. git commit -am "…" && git push      deploy each change\n');
			process.exit(0);
			break;

		case 'launch':
			await launch({
				name: args.publishName,
				branch: args.branch,
				rootDirectory: args.rootDirectory,
				uploadCredentials: args.uploadCredentials
			});
			// launch handles its own exit codes
			break;

		case 'link':
			await link({
				project: args.linkProject,
				branch: args.branch,
				rootDirectory: args.rootDirectory
			});
			break;

		case 'unlink':
			await unlink({ project: args.linkProject });
			break;

		case 'dev': {
			console.log(BANNER);
			// No auth gate: pages render without data, and queries degrade to a
			// per-query error when unauthenticated — login isn't forced to start.
			// Detect whether we're the compiled binary or running from source.
			// The compiled bundle has process.execPath pointing at itself; running
			// from source via `bun cli/index.ts` has it pointing at the bun runtime.
			const isSource = path.basename(process.execPath).startsWith('bun');
			const open = args.open ?? !isSource;
			if (isSource) {
				const { startDevServer } = await import('./server.dev.ts');
				await startDevServer({ port: args.port, open });
			} else {
				const { startServer } = await import('./server.ts');
				await startServer({ port: args.port, open, host: args.host });
			}
			break;
		}

		case 'serve': {
			console.log(BANNER);
			// Self-hosted serving needs no Studio session, but it does need a direct
			// connector — the managed engine requires WorkOS auth and stays dev-only.
			if (!hasConnectionYaml()) {
				console.error(
					'  ✗ serve requires a connection.yaml (direct connector).\n' +
						'    The managed query engine is not supported for self-hosting.'
				);
				process.exit(1);
			}
			// EVIDENCE_SERVE is read by the embedded SvelteKit app (hooks, routes,
			// layout data) to strip dev machinery and enforce hardened behavior.
			process.env.EVIDENCE_SERVE = '1';
			const isSource = path.basename(process.execPath).startsWith('bun');
			if (isSource) {
				console.error('  ✗ serve is only available in the compiled CLI binary.');
				process.exit(1);
			}
			const { startServer } = await import('./server.ts');
			await startServer({ port: args.port, open: args.open ?? false, host: args.host });
			break;
		}
	}
} catch (err) {
	const message = err instanceof Error ? err.message : String(err);
	console.error(`  ✗ ${message}\n`);
	process.exit(1);
}
