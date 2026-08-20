/**
 * `evidence init [target] [--force]` — scaffold a new Evidence project.
 *
 * Refuses if the target directory is non-empty. `--force` clears the
 * directory's contents (deterministic fresh scaffold). Templates are inlined
 * as strings so the compiled binary doesn't need a separate template dir.
 */

import { mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { VERSION } from '../args.ts';
import { connectionYamlTemplate, type InitWarehouse } from './connection-template.ts';
import { buildThemeYamlContent } from '@evidence/core/theme/build-theme-yaml';
import { serializeAccessState } from '@evidence/core/access-yaml/serialize';

const DEFAULT_PROJECT_NAME = 'My Evidence Project';

const EVIDENCE_CONFIG_TEMPLATE = `project:
  name: "{{name}}"
  evidence: "{{version}}"

pages: ./pages
`;

const HOME_MD_TEMPLATE = `# Welcome to Evidence

Edit \`pages/home.md\` to start building your data report.
`;

// Vendored from evidence-dev/template (studio branch). Orients an AI agent —
// docs location, CLI usage, the Markdoc/ClickHouse syntax, and worked examples.
const AGENTS_MD_TEMPLATE = `# Evidence Project

This is an Evidence Studio project — interactive data reports written in Markdown with embedded Markdoc components, backed by SQL.

The latest version of Evidence has some key changes you may not be aware of (recent AI models aren't trained on the new syntax) — read these carefully:
1. The docs are now hosted at https://docs.evidence.studio
2. You run the [Evidence CLI](https://docs.evidence.studio/cli) to start the dev server, validate syntax, retrieve docs etc. Run \`evidence help\` to see all commands.
3. The syntax has changed:
  a. Components are markdoc style {% table data="demo.daily_orders" /%}
  b. SQL now runs ClickHouse SQL, unless you are using a direct connector, in which case it runs native SQL for your warehouse
4. Sample data is available, run \`evidence tables\` to see it.

## Install Evidence CLI
### MacOS / Linux
\`\`\`shell
curl -fsSL https://evidence.studio/install.sh | sh
\`\`\`
### Windows
\`\`\`powershell
irm https://evidence.studio/install.ps1 | iex
\`\`\`

## Using the CLI

- \`evidence help\` — discover all available commands
- \`evidence login\` — authenticate (the user may need to run this themselves, as it requires a browser verification code step)
- \`evidence dev\` — start the local dev server to view report pages; show the user the URL, or — better — open it in their browser
- \`evidence validate\` — check Markdown and component syntax

## Example: Sample Data

\`\`\`\`markdown
# Orders by Month

{% dropdown data="demo.daily_orders" id="category" value_column="category" /%}

{% table
  data="demo.daily_orders"
  filters=["category"]
/%}
\`\`\`\`

## Example: Inline Data

\`\`\`\`markdown

\`\`\`sql item_sales
select 223 as sales, 'Widgets' as product
union all
select 498 as sales, 'Gizmos' as product
union all
select 354 as sales, 'Thingys' as product
\`\`\`

# Product Sales

{% bar_chart
  data="item_sales"
  x="product"
  y="sum(sales)"
  order="sum(sales) desc"
/%}

\`\`\`\`

## Credentials
Credentials for direct connectors live in connection.yaml in the project root. If connection.yaml is not specified the Evidence Warehouse will be used.
`;

// Claude Code reads CLAUDE.md, not AGENTS.md — point it at the shared file.
const CLAUDE_MD_TEMPLATE = `@AGENTS.md
`;

const GITIGNORE_ENTRIES = ['.evidence/', 'connection.yaml'];

export class InitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InitError';
	}
}

export interface RunInitOptions {
	/** Target subdirectory under `cwd`. If null, scaffold directly into `cwd`. */
	targetDir: string | null;
	/** The current working directory the user invoked `evidence init` from. */
	cwd: string;
	/**
	 * If true, overwrite scaffold files (evidence.config.yaml, pages/home.md)
	 * when they already exist. Other files in pages/ are always preserved.
	 */
	force?: boolean;
	/**
	 * If set, scaffold a connection.yaml for this warehouse so the project
	 * queries it directly. If absent, no connection.yaml is written and the
	 * project falls back to the managed Evidence Warehouse.
	 */
	warehouse?: InitWarehouse | null;
}

export interface RunInitResult {
	/** Absolute path to the scaffolded project root. */
	projectRoot: string;
	/** Whether a new directory was created (true) or scaffolded into existing cwd (false). */
	createdDirectory: boolean;
	/** Warehouse a connection.yaml was scaffolded for, or null if none. */
	warehouse: InitWarehouse | null;
}

export async function runInit(options: RunInitOptions): Promise<RunInitResult> {
	const projectRoot = options.targetDir
		? path.resolve(options.cwd, options.targetDir)
		: path.resolve(options.cwd);

	if (options.force) {
		await clearDirectoryContents(projectRoot);
	} else if (!(await isEmptyOrMissing(projectRoot))) {
		throw new InitError(
			`${projectRoot} is not empty.\n` +
				`  Scaffold into a new directory, e.g. \`evidence init my-project\`,\n` +
				`  or re-run with --force to overwrite this directory's contents.`
		);
	}

	// Derive the name from the target folder (basename), whether passed as an
	// argument or scaffolding into cwd. Fall back to the default only at a
	// filesystem root where basename is empty.
	const projectName = path.basename(projectRoot) || DEFAULT_PROJECT_NAME;

	await mkdir(projectRoot, { recursive: true });
	await mkdir(path.join(projectRoot, 'pages'), { recursive: true });

	await writeFile(
		path.join(projectRoot, 'evidence.config.yaml'),
		EVIDENCE_CONFIG_TEMPLATE
			.replace('{{name}}', escapeYamlDoubleQuoted(projectName))
			.replace('{{version}}', escapeYamlDoubleQuoted(VERSION)),
		'utf-8'
	);
	await writeFile(path.join(projectRoot, 'pages', 'home.md'), HOME_MD_TEMPLATE, 'utf-8');
	await writeFile(path.join(projectRoot, 'AGENTS.md'), AGENTS_MD_TEMPLATE, 'utf-8');
	await writeFile(path.join(projectRoot, 'CLAUDE.md'), CLAUDE_MD_TEMPLATE, 'utf-8');
	await writeFile(path.join(projectRoot, 'theme.yaml'), buildThemeYamlContent(), 'utf-8');
	await writeFile(
		path.join(projectRoot, '.gitignore'),
		GITIGNORE_ENTRIES.map((e) => e + '\n').join(''),
		'utf-8'
	);
	await writeFile(path.join(projectRoot, 'access.yaml'), serializeAccessState({ project: { restricted: true, grants: { users: [], groups: [] } }, pages: [] }), 'utf-8');

	const warehouse = options.warehouse ?? null;
	if (warehouse) {
		await writeFile(
			path.join(projectRoot, 'connection.yaml'),
			connectionYamlTemplate(warehouse),
			'utf-8'
		);
	}

	return {
		projectRoot,
		createdDirectory: options.targetDir !== null,
		warehouse
	};
}

async function isEmptyOrMissing(dir: string): Promise<boolean> {
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') return true;
		throw e;
	}
	return entries.length === 0;
}

async function clearDirectoryContents(dir: string): Promise<void> {
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') return;
		throw e;
	}
	await Promise.all(
		entries.map((entry) => rm(path.join(dir, entry), { recursive: true, force: true }))
	);
}

// Escape a string so it's safe to drop inside a YAML double-quoted scalar.
// YAML double-quoted strings interpret backslash escapes, so we must escape
// `\` first, then `"`.
function escapeYamlDoubleQuoted(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
