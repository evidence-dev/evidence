/**
 * CLI argument parsing and help
 */

import {
	resolveColor,
	resolveInteractive,
	type OutputFormat,
	type OutputOptions
} from './output.ts';
import { INIT_WAREHOUSES, parseWarehouse, type InitWarehouse } from './init/connection-template.ts';

export const VERSION = '0.9.1';

export const BANNER = `
  evidence
  v${VERSION}
`;

export const HELP = `
Usage: evidence <command> [options]

Develop
  init        Scaffold a new Evidence project
  dev         Start the local development server
  validate    Validate project markdown
  migrate     Convert a legacy Evidence project to Core syntax

Deploy
  launch      Connect this project to Evidence Studio + GitHub (deploy via git push)
  link        Attach this repo to an existing Studio project
  unlink      Disconnect this repo from its Studio project

Data
  query       Run a SQL query against the warehouse
  tables      List available tables
  describe    Show a table's schema
  schema      Show all tables and columns
  connectors  List connectors and health
  models      List models and refresh status
  lineage     Show where connections and tables are used

Query usage
  evidence query "SELECT ..."        Run inline SQL
  evidence query --file <path.sql>   Run SQL from a file
  cat query.sql | evidence query     Run SQL from stdin
  --limit <n> | --all                Row cap (default 1000)
  --output <path>, -o                Write results to a file

Account
  login       Authenticate with Evidence Studio
  signup      Create an account and workspace
  logout      Clear stored credentials
  whoami      Show the current user
  orgs        List organizations
  switch      Switch organization
  token       Generate a headless/CI auth token

Other
  docs        Search Evidence documentation
  upgrade     Upgrade the CLI

Options
  --format <json|ndjson|csv|table>   Output format
  --verbose                          More detail
  --project <path>                   Run against a project at this path (default: cwd)
  --help, -h                         Show help
  --version                          Show version

Docs: https://docs.evidence.studio
`;

export type Command =
	| 'default'
	| 'init'
	| 'dev'
	| 'serve'
	| 'publish'
	| 'launch'
	| 'link'
	| 'unlink'
	| 'query'
	| 'login'
	| 'signup'
	| 'logout'
	| 'whoami'
	| 'orgs'
	| 'switch'
	| 'tables'
	| 'describe'
	| 'schema'
	| 'connectors'
	| 'models'
	| 'validate'
	| 'migrate'
	| 'lineage'
	| 'docs'
	| 'token'
	| 'upgrade'
	| 'help'
	| 'version';

export interface QueryOptions {
	/** The SQL query to execute (or '-' to read from stdin) */
	sql: string | null;
	/** Read SQL from this file */
	file: string | null;
	/** Write output to this file instead of stdout */
	output: string | null;
}

export interface ParsedArgs {
	command: Command;
	port: number;
	query: QueryOptions;
	/** Shared output controls (format, columns, limit, verbose, color). */
	output: OutputOptions;
	/** Table name for describe command */
	tableName: string | null;
	/** Organization name or ID for switch command */
	orgIdentifier: string | null;
	/** Target directory for init command (positional arg after `init`); null = current cwd */
	initTargetDir: string | null;
	/** Force-overwrite scaffold files in the target dir (for `init`). */
	initForce: boolean;
	/** Warehouse to scaffold a connection.yaml for (for `init`); null = none. */
	initWarehouse: InitWarehouse | null;
	/** Single page to validate (positional arg after `validate`); null = whole project */
	validatePath: string | null;
	/** Single page to migrate (positional arg after `migrate`); null = whole project */
	migratePath: string | null;
	/** Report what `migrate` would change without writing files (--dry-run) */
	migrateDryRun: boolean;
	/** Subcommand for docs (search, component, read) */
	docsSubcommand: string | null;
	/** Arguments for docs subcommand */
	docsArgs: string[];
	/** Table name to narrow `schema` to a single table (--table). */
	schemaTable: string | null;
	/** Arguments for lineage subcommand */
	lineageArgs: string[];
	/** Branch for lineage command */
	lineageBranch: string | null;
	/** Override for the project directory (chdirs before running) */
	project: string | null;
	/** Project name (--name); used when creating a new project (publish/launch) */
	publishName: string | null;
	/** Branch override (--branch) for launch/link; null = auto-detect */
	branch: string | null;
	/** Root directory within the repo (--root-directory) for launch/link; null = auto-detect */
	rootDirectory: string | null;
	/** Explicitly opt in to uploading warehouse credentials in non-TTY launch (--upload-credentials) */
	uploadCredentials: boolean;
	/** Existing Studio project (slug or id) to attach for `link` (--project) */
	linkProject: string | null;
	/**
	 * Whether the dev command should auto-open the browser.
	 * `undefined` means the user didn't specify; the dev command picks an
	 * appropriate default (binary: true, running from source: false).
	 */
	open: boolean | undefined;
	/** Bind address for dev/serve (--host); null = mode default. */
	host: string | null;
}

/** Flags that consume the following token as their value. */
const VALUE_FLAGS = new Set([
	'--format',
	'--limit',
	'-l',
	'--columns',
	'--file',
	'--output',
	'-o',
	'--table',
	'--branch',
	'--name',
	'--port',
	'-p',
	'--host',
	'--warehouse',
	'--root-directory',
	'--project'
]);

/** Boolean flags (no value). */
const BOOLEAN_FLAGS = new Set([
	'--all',
	'--verbose',
	'-v',
	'--no-color',
	'--json',
	'--quiet',
	'-q',
	'--help',
	'-h',
	'--version',
	'--force',
	'-f',
	'--no-open',
	'--open',
	'--upload-credentials',
	'--dry-run'
]);

/**
 * Extract the shared output controls once, for every data command. Returns a
 * fully-resolved `OutputOptions` (including resolved `color`) so callers can
 * pass it straight to the output module.
 */
function extractOutputOptions(args: string[]): OutputOptions {
	// -o is the file-output flag (query), NOT format; --format is long-form only.
	let format: OutputFormat | null = null;
	const fmtIdx = args.findIndex((a) => a === '--format');
	if (fmtIdx !== -1 && args[fmtIdx + 1]) {
		const raw = args[fmtIdx + 1];
		const norm = raw === 'jsonl' ? 'ndjson' : raw;
		if (norm === 'json' || norm === 'ndjson' || norm === 'csv' || norm === 'table') {
			format = norm;
		}
	}
	// `--json` is a back-compatible alias for `--format json`.
	if (format === null && args.includes('--json')) format = 'json';

	let columns: string[] | null = null;
	const colIdx = args.findIndex((a) => a === '--columns');
	if (colIdx !== -1 && args[colIdx + 1] && !args[colIdx + 1].startsWith('-')) {
		columns = args[colIdx + 1]
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}

	let limit: number | null = null;
	const limitIdx = args.findIndex((a) => a === '--limit' || a === '-l');
	if (limitIdx !== -1 && args[limitIdx + 1]) {
		const parsed = parseInt(args[limitIdx + 1], 10);
		if (!isNaN(parsed) && parsed > 0) limit = parsed;
	}

	const all = args.includes('--all');
	const verbose = args.includes('--verbose') || args.includes('-v');
	const noColor = args.includes('--no-color');

	return {
		format,
		columns,
		limit,
		all,
		verbose,
		interactive: resolveInteractive(),
		color: resolveColor(noColor)
	};
}

export function parseArgs(): ParsedArgs {
	// Strip global --project <path> from argv up-front so the rest of the
	// parser (which keys off positional args[0] and indexOf for things like
	// `query`/`describe`) doesn't have to handle it inline.
	const rawArgs = process.argv.slice(2);
	const args: string[] = [];
	let project: string | null = null;
	// For `link`/`unlink`, `--project <slug|id>` names a Studio project, not a
	// local directory — leave it in `args` for command-scoped parsing instead of
	// consuming it as the global chdir override.
	const projectFlagIsLinkTarget = rawArgs[0] === 'link' || rawArgs[0] === 'unlink';
	for (let i = 0; i < rawArgs.length; i++) {
		if (rawArgs[i] === '--project' && !projectFlagIsLinkTarget) {
			const value = rawArgs[i + 1];
			if (!value || value.startsWith('-')) {
				console.error('Error: --project requires a path argument (e.g. --project ./my-project)');
				process.exit(1);
			}
			project = value;
			i++;
			continue;
		}
		args.push(rawArgs[i]);
	}

	// Default query options
	const query: QueryOptions = {
		sql: null,
		file: null,
		output: null
	};

	// Shared output controls, resolved once for all commands.
	const output = extractOutputOptions(args);

	const base = {
		port: 3000,
		query,
		output,
		tableName: null,
		orgIdentifier: null,
		initTargetDir: null,
		initForce: false,
		initWarehouse: null,
		validatePath: null,
		migratePath: null,
		migrateDryRun: false,
		docsSubcommand: null,
		docsArgs: [],
		schemaTable: null,
		lineageArgs: [],
		lineageBranch: null,
		project: null,
		publishName: null,
		branch: null,
		rootDirectory: null,
		uploadCredentials: false,
		linkProject: null,
		open: undefined,
		host: null
	} satisfies Omit<ParsedArgs, 'command'>;

	// Check for help/version flags first. Note: `-v` now means `--verbose`
	// (handled in extractOutputOptions); only the long `--version` and the
	// `version` subcommand show the version.
	if (args.includes('--help') || args.includes('-h')) {
		return { ...base, command: 'help' };
	}
	if (args.includes('--version')) {
		return { ...base, command: 'version' };
	}

	// Get command
	const firstArg = args[0];
	let command: Command = 'default';
	let tableName: string | null = null;
	let orgIdentifier: string | null = null;

	const knownCommands = [
		'help',
		'version',
		'init',
		'login',
		'signup',
		'logout',
		'whoami',
		'orgs',
		'switch',
		'token',
		'query',
		'tables',
		'describe',
		'schema',
		'connectors',
		'models',
		'validate',
		'migrate',
		'lineage',
		'docs',
		'upgrade',
		'dev',
		'serve',
		'publish',
		'launch',
		'link',
		'unlink'
	];

	let initTargetDir: string | null = null;
	let initForce = false;
	let initWarehouse: InitWarehouse | null = null;

	if (firstArg === 'help') command = 'help';
	else if (firstArg === 'version') command = 'version';
	else if (firstArg === 'init') {
		command = 'init';
		// Optional positional: target directory name.
		if (args[1] && !args[1].startsWith('-')) {
			initTargetDir = args[1];
		}
		// --force / -f overwrites scaffold files in a non-empty target.
		if (args.includes('--force') || args.includes('-f')) {
			initForce = true;
		}
		// --warehouse <type> scaffolds a connection.yaml for that warehouse.
		const warehouseIdx = args.findIndex((a) => a === '--warehouse');
		if (warehouseIdx !== -1) {
			const value = args[warehouseIdx + 1];
			if (!value || value.startsWith('-')) {
				console.error('Missing value for --warehouse.');
				console.error(`Supported warehouses: ${INIT_WAREHOUSES.join(', ')}.`);
				process.exit(1);
			}
			const parsed = parseWarehouse(value);
			if (!parsed) {
				console.error(`Unsupported warehouse: '${value}'.`);
				console.error(`Supported warehouses: ${INIT_WAREHOUSES.join(', ')}.`);
				process.exit(1);
			}
			initWarehouse = parsed;
		}
	} else if (firstArg === 'login') command = 'login';
	else if (firstArg === 'signup') command = 'signup';
	else if (firstArg === 'logout') command = 'logout';
	else if (firstArg === 'whoami') command = 'whoami';
	else if (firstArg === 'orgs') command = 'orgs';
	else if (firstArg === 'token') command = 'token';
	else if (firstArg === 'switch') {
		command = 'switch';
		// Get org name/id from remaining arguments (supports multi-word names)
		const remainingArgs = args.slice(1).filter((a) => !a.startsWith('-'));
		if (remainingArgs.length > 0) {
			orgIdentifier = remainingArgs.join(' ');
		}
	} else if (firstArg === 'query') command = 'query';
	else if (firstArg === 'tables') command = 'tables';
	else if (firstArg === 'schema') command = 'schema';
	else if (firstArg === 'connectors') command = 'connectors';
	else if (firstArg === 'models') command = 'models';
	else if (firstArg === 'validate') command = 'validate';
	else if (firstArg === 'migrate') command = 'migrate';
	else if (firstArg === 'lineage') command = 'lineage';
	else if (firstArg === 'docs') command = 'docs';
	else if (firstArg === 'upgrade') command = 'upgrade';
	else if (firstArg === 'dev') command = 'dev';
	else if (firstArg === 'serve') command = 'serve';
	else if (firstArg === 'publish') command = 'publish';
	else if (firstArg === 'launch') command = 'launch';
	else if (firstArg === 'link') command = 'link';
	else if (firstArg === 'unlink') command = 'unlink';
	else if (firstArg === 'describe') {
		command = 'describe';
		// Get table name from second argument
		if (args[1] && !args[1].startsWith('-')) {
			tableName = args[1];
		}
	} else if (!firstArg || firstArg.startsWith('-')) {
		command = 'default';
	} else if (firstArg && !knownCommands.includes(firstArg)) {
		// Unknown command - provide helpful error
		console.error(`Unknown command: '${firstArg}'`);
		console.error(`Run 'evidence help' for available commands.`);
		process.exit(1);
	}

	// Get port (for dev/serve commands)
	let port = 3000;
	const portIdx = args.findIndex((a) => a === '--port' || a === '-p');
	if (portIdx !== -1 && args[portIdx + 1]) {
		const parsed = parseInt(args[portIdx + 1], 10);
		if (!isNaN(parsed)) port = parsed;
	}

	// --host <addr> (bind address for dev/serve); null = mode default
	let host: string | null = null;
	const hostIdx = args.findIndex((a) => a === '--host');
	if (hostIdx !== -1 && args[hostIdx + 1] && !args[hostIdx + 1].startsWith('-')) {
		host = args[hostIdx + 1];
	}

	// --name <value> (for publish/launch)
	let publishName: string | null = null;
	const nameIdx = args.findIndex((a) => a === '--name');
	if (nameIdx !== -1 && args[nameIdx + 1]) {
		publishName = args[nameIdx + 1];
	}

	// --branch <value> (launch/link); reuse for nothing else here.
	let branch: string | null = null;
	const branchIdx = args.findIndex((a) => a === '--branch');
	if (branchIdx !== -1 && args[branchIdx + 1] && !args[branchIdx + 1].startsWith('-')) {
		branch = args[branchIdx + 1];
	}

	// --root-directory <value> (launch/link)
	let rootDirectory: string | null = null;
	const rootDirIdx = args.findIndex((a) => a === '--root-directory');
	if (rootDirIdx !== -1 && args[rootDirIdx + 1] && !args[rootDirIdx + 1].startsWith('-')) {
		rootDirectory = args[rootDirIdx + 1];
	}

	// --upload-credentials (launch)
	const uploadCredentials = args.includes('--upload-credentials');

	// --project <slug|id> for link/unlink (left in `args` by the conditional
	// global-strip above). A positional project arg is also accepted.
	let linkProject: string | null = null;
	if (command === 'link' || command === 'unlink') {
		const projIdx = args.findIndex((a) => a === '--project');
		if (projIdx !== -1 && args[projIdx + 1] && !args[projIdx + 1].startsWith('-')) {
			linkProject = args[projIdx + 1];
		} else {
			const positional = args.slice(1).find((a) => !a.startsWith('-'));
			if (positional) linkProject = positional;
		}
	}

	// Browser auto-open (for dev command). Tri-state: undefined = use the
	// mode-appropriate default. Binary defaults to true, source to false.
	let open: boolean | undefined;
	if (args.includes('--no-open')) open = false;
	else if (args.includes('--open')) open = true;

	// Parse query-specific options (SQL source; format/limit/columns are shared)
	if (command === 'query') {
		// --file <path>
		const fileIdx = args.findIndex((a) => a === '--file');
		if (fileIdx !== -1 && args[fileIdx + 1]) {
			query.file = args[fileIdx + 1];
		}

		// --output, -o <path> — write results to a file
		const outputIdx = args.findIndex((a) => a === '--output' || a === '-o');
		if (outputIdx !== -1 && args[outputIdx + 1]) {
			query.output = args[outputIdx + 1];
		}

		// SQL positional: the first token after `query` that is not a known
		// flag (or the value of one). Crucially, a token starting with `--`
		// that is NOT a known flag — e.g. SQL beginning with a `-- comment` —
		// is treated as the SQL, not misparsed as a flag (which previously
		// caused the command to fall through to stdin and hang).
		const queryIdx = args.indexOf('query');
		if (queryIdx !== -1) {
			for (let i = queryIdx + 1; i < args.length; i++) {
				const arg = args[i];
				if (VALUE_FLAGS.has(arg)) {
					i++; // skip the flag's value
					continue;
				}
				if (BOOLEAN_FLAGS.has(arg)) continue;
				query.sql = arg;
				break;
			}
		}
	}

	// --json flag (still consumed by validate)
	// Optional single-page positional for validate (e.g. `evidence validate orders.md`).
	// Skip flags and any value they consume (e.g. `--port 8080`) so a flag value
	// isn't mistaken for the page path.
	let validatePath: string | null = null;
	if (command === 'validate') {
		const rest = args.slice(args.indexOf('validate') + 1);
		for (let i = 0; i < rest.length; i++) {
			const arg = rest[i];
			if (arg.startsWith('-')) {
				if (VALUE_FLAGS.has(arg)) i++; // step over the flag's value
				continue;
			}
			validatePath = arg;
			break;
		}
	}

	// Optional single-page positional for migrate (e.g. `evidence migrate orders.md`).
	let migratePath: string | null = null;
	if (command === 'migrate') {
		const rest = args.slice(args.indexOf('migrate') + 1);
		for (let i = 0; i < rest.length; i++) {
			const arg = rest[i];
			if (arg.startsWith('-')) {
				if (VALUE_FLAGS.has(arg)) i++; // step over the flag's value
				continue;
			}
			migratePath = arg;
			break;
		}
	}
	const migrateDryRun = args.includes('--dry-run');

	// Parse docs subcommand and args
	let docsSubcommand: string | null = null;
	let docsArgs: string[] = [];
	if (command === 'docs') {
		const docsIdx = args.indexOf('docs');
		const remaining = args.slice(docsIdx + 1).filter((a) => !a.startsWith('-'));
		docsSubcommand = remaining[0] ?? null;
		docsArgs = remaining.slice(1);
	}

	// --table <name> (narrows `schema` to one table)
	let schemaTable: string | null = null;
	if (command === 'schema') {
		const tableIdx = args.findIndex((a) => a === '--table');
		if (tableIdx !== -1 && args[tableIdx + 1] && !args[tableIdx + 1].startsWith('-')) {
			schemaTable = args[tableIdx + 1];
		}
	}

	// Parse lineage subcommand and args
	let lineageArgs: string[] = [];
	let lineageBranch: string | null = null;
	if (command === 'lineage') {
		const lineageIdx = args.indexOf('lineage');
		const remaining = args.slice(lineageIdx + 1);
		const branchIdx = remaining.findIndex((a) => a === '--branch');
		if (branchIdx !== -1 && remaining[branchIdx + 1]) {
			lineageBranch = remaining[branchIdx + 1];
		}
		// Exclude flags and the --branch value (branchIdx + 1), but only when --branch is present
		const branchValueIdx = branchIdx !== -1 ? branchIdx + 1 : -1;
		lineageArgs = remaining.filter((a, i) => !a.startsWith('-') && i !== branchValueIdx);
	}

	return {
		...base,
		command,
		port,
		tableName,
		orgIdentifier,
		initTargetDir,
		initForce,
		initWarehouse,
		validatePath,
		migratePath,
		migrateDryRun,
		docsSubcommand,
		docsArgs,
		schemaTable,
		lineageArgs,
		lineageBranch,
		project,
		publishName,
		branch,
		rootDirectory,
		uploadCredentials,
		linkProject,
		open,
		host
	};
}

export function showHelp(): void {
	console.log(BANNER);
	console.log(HELP);
}

export function showVersion(): void {
	console.log(VERSION);
}

export interface AuthStatusForWelcome {
	loggedIn: boolean;
	expired?: boolean;
	unverified?: boolean;
	email?: string;
	orgName?: string | null;
}

export function showDefault(status: AuthStatusForWelcome): void {
	console.log(BANNER);

	// Status
	if (status.expired) {
		console.log('  Status: session expired');
		if (status.email) console.log(`  User:   ${status.email}`);
		console.log('  Run `evidence login` to re-authenticate.');
	} else if (status.loggedIn) {
		console.log(`  Status: logged in${status.unverified ? ' (offline — could not verify)' : ''}`);
		console.log(`  User:   ${status.email ?? '—'}`);
		console.log(`  Org:    ${status.orgName ?? '—'}`);
	} else {
		console.log('  Status: not logged in');
		console.log('  Run `evidence login` to authenticate.');
	}
	console.log('');

	// Introduction
	console.log('  Evidence CLI — run and develop Evidence projects locally.');
	console.log('');

	// Commands
	console.log('  Commands:  dev, launch, link, unlink, query, tables, describe, schema,');
	console.log(
		'             connectors, validate, docs, login, logout, whoami, orgs, switch, token'
	);
	console.log('  Run `evidence help` for full usage and options.');
	console.log('');
}
