import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { runInit, InitError } from './init.ts';
import { loadProjectConfig } from '../project-config/load-config.ts';
import { loadConnectionConfig } from '../connection/load-config.ts';

let workDir: string;

beforeEach(async () => {
	workDir = await mkdtemp(path.join(tmpdir(), 'evidence-init-test-'));
});

afterEach(async () => {
	await rm(workDir, { recursive: true, force: true });
});

async function exists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}

describe('runInit', () => {
	describe('scaffold into cwd (no target arg)', () => {
		it('creates evidence.config.yaml, pages/home.md, and .gitignore', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			expect(await exists(path.join(workDir, 'evidence.config.yaml'))).toBe(true);
			expect(await exists(path.join(workDir, 'pages', 'home.md'))).toBe(true);
			expect(await exists(path.join(workDir, '.gitignore'))).toBe(true);
		});

		it('writes an AGENTS.md that orients an agent and uses valid component syntax', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			const agents = await readFile(path.join(workDir, 'AGENTS.md'), 'utf-8');
			expect(agents).toContain('https://docs.evidence.dev');
			// init creates real projects, not templates — don't frame it as one
			expect(agents).not.toMatch(/template project/i);
			// orients the agent to run the project
			expect(agents).toContain('evidence dev');
			// dropdown uses value_column (not value), and tags self-close with /%}
			expect(agents).toContain('value_column="category" /%}');
			expect(agents).not.toMatch(/\{% end\w/);
		});

		it('writes a CLAUDE.md that imports AGENTS.md', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			const claude = await readFile(path.join(workDir, 'CLAUDE.md'), 'utf-8');
			expect(claude.trim()).toBe('@AGENTS.md');
		});

		it('produces a tree that loadProjectConfig parses cleanly', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			const cfg = await loadProjectConfig(workDir);
			expect(cfg.isDefaultConfig).toBe(false);
			expect(cfg.project.evidence).toMatch(/^\d+\.\d+\.\d+/);
			// name derives from the cwd folder name when no target dir is passed
			expect(cfg.project.name).toBe(path.basename(workDir));
			expect(cfg.pagesDir).toBe(path.resolve(workDir, 'pages'));
		});

		it('does not include a commented theme block in the scaffolded config', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			const yamlConfig = await readFile(path.join(workDir, 'evidence.config.yaml'), 'utf-8');
			expect(yamlConfig).not.toMatch(/theme/i);
		});

		it('creates empty theme.yaml file', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			expect(await exists(path.join(workDir, 'theme.yaml'))).toBe(true);
		});

		it('scaffolds theme.yaml with the default theme (matching Studio)', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			const content = await readFile(path.join(workDir, 'theme.yaml'), 'utf-8');
			// Same content Studio writes via buildThemeYamlContent.
			expect(content).toContain('# Theme Configuration');
			expect(content).toContain('docs.evidence.studio');
			expect(content).toContain('colors:');
			expect(content).toContain('colorPalettes:');
			expect(content).toContain('colorScales:');
		});

		it('does not scaffold translations.yaml by default', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			expect(await exists(path.join(workDir, 'translations.yaml'))).toBe(false);
		});

		it('produces a loadProjectConfig result with the scaffolded theme and no translations', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			const cfg = await loadProjectConfig(workDir);
			// theme.yaml carries the default theme, so it parses to a colors object
			expect(cfg.theme?.colors).toBeDefined();
			// translations should be empty (no translations.yaml created)
			expect(cfg.translations).toEqual({});
		});

		it('writes a .gitignore that includes .evidence/ and connection.yaml', async () => {
			await runInit({ targetDir: null, cwd: workDir });

			const gitignore = await readFile(path.join(workDir, '.gitignore'), 'utf-8');
			expect(gitignore).toContain('.evidence/');
			// connection.yaml can hold inline Snowflake passwords/private keys or
			// BigQuery service-account JSON — must not be committed by default.
			expect(gitignore).toContain('connection.yaml');
		});
	});

	describe('scaffold into named directory', () => {
		it('creates the target directory and scaffolds inside it', async () => {
			await runInit({ targetDir: 'my-project', cwd: workDir });

			const projectDir = path.join(workDir, 'my-project');
			expect(await exists(path.join(projectDir, 'evidence.config.yaml'))).toBe(true);
			expect(await exists(path.join(projectDir, 'pages', 'home.md'))).toBe(true);
		});

		it('names the project after the target directory', async () => {
			await runInit({ targetDir: 'my-project', cwd: workDir });

			const cfg = await loadProjectConfig(path.join(workDir, 'my-project'));
			expect(cfg.project.name).toBe('my-project');
		});
	});

	describe('non-empty refusal', () => {
		it('refuses when target dir contains any regular file', async () => {
			await writeFile(path.join(workDir, 'anything.txt'), 'x', 'utf-8');

			await expect(runInit({ targetDir: null, cwd: workDir })).rejects.toThrow(InitError);
		});

		it('refuses when target dir contains a hidden file (e.g. after git init)', async () => {
			await writeFile(path.join(workDir, '.gitignore'), 'node_modules/\n', 'utf-8');

			await expect(runInit({ targetDir: null, cwd: workDir })).rejects.toThrow(InitError);
		});

		it('refuses when target dir contains any subdirectory', async () => {
			await mkdir(path.join(workDir, 'something'), { recursive: true });

			await expect(runInit({ targetDir: null, cwd: workDir })).rejects.toThrow(InitError);
		});

		it('refuses when named target dir is non-empty', async () => {
			const projectDir = path.join(workDir, 'taken');
			await mkdir(projectDir, { recursive: true });
			await writeFile(path.join(projectDir, 'anything.txt'), 'x', 'utf-8');

			await expect(runInit({ targetDir: 'taken', cwd: workDir })).rejects.toThrow(InitError);
		});

		it('does not partially write when refusing', async () => {
			await writeFile(path.join(workDir, 'anything.txt'), 'x', 'utf-8');

			await expect(runInit({ targetDir: null, cwd: workDir })).rejects.toThrow();

			// scaffold files should NOT have been written
			expect(await exists(path.join(workDir, 'evidence.config.yaml'))).toBe(false);
			expect(await exists(path.join(workDir, 'pages'))).toBe(false);
		});

		it('error message points to the --force flag', async () => {
			await writeFile(path.join(workDir, 'anything.txt'), 'x', 'utf-8');

			await expect(runInit({ targetDir: null, cwd: workDir })).rejects.toThrow(/--force/);
		});

		it('error message suggests scaffolding into a new directory, with example syntax', async () => {
			await writeFile(path.join(workDir, 'anything.txt'), 'x', 'utf-8');

			await expect(runInit({ targetDir: null, cwd: workDir })).rejects.toThrow(
				/evidence init my-project/
			);
		});
	});

	describe('--force overwrite', () => {
		it('clears all existing contents (including hidden files and subdirs) before scaffolding', async () => {
			await mkdir(path.join(workDir, 'old-dir'), { recursive: true });
			await writeFile(path.join(workDir, 'old-dir', 'thing.txt'), 'old', 'utf-8');
			await writeFile(path.join(workDir, '.gitignore'), 'custom\n', 'utf-8');
			await writeFile(path.join(workDir, 'evidence.config.yaml'), 'old config', 'utf-8');

			await runInit({ targetDir: null, cwd: workDir, force: true });

			// Prior contents are gone
			expect(await exists(path.join(workDir, 'old-dir'))).toBe(false);

			// Fresh scaffold present
			expect(await exists(path.join(workDir, 'evidence.config.yaml'))).toBe(true);
			expect(await exists(path.join(workDir, 'pages', 'home.md'))).toBe(true);

			// .gitignore is the standard scaffold, not the prior custom content
			const gitignore = await readFile(path.join(workDir, '.gitignore'), 'utf-8');
			expect(gitignore).not.toContain('custom');
			expect(gitignore).toContain('.evidence/');
			expect(gitignore).toContain('connection.yaml');

			// evidence.config.yaml is fresh
			const config = await readFile(path.join(workDir, 'evidence.config.yaml'), 'utf-8');
			expect(config).not.toContain('old config');
			expect(config).toContain('evidence:');
		});

		it('still works against a non-existent named target dir', async () => {
			await runInit({ targetDir: 'brand-new', cwd: workDir, force: true });

			expect(await exists(path.join(workDir, 'brand-new', 'evidence.config.yaml'))).toBe(true);
		});
	});

	describe('--warehouse scaffolds connection.yaml', () => {
		it('writes no connection.yaml when warehouse is omitted', async () => {
			const result = await runInit({ targetDir: null, cwd: workDir });

			expect(result.warehouse).toBeNull();
			expect(await exists(path.join(workDir, 'connection.yaml'))).toBe(false);
		});

		it('scaffolds a snowflake connection.yaml whose unfilled placeholders are rejected', async () => {
			const result = await runInit({ targetDir: null, cwd: workDir, warehouse: 'snowflake' });

			expect(result.warehouse).toBe('snowflake');
			expect(await exists(path.join(workDir, 'connection.yaml'))).toBe(true);

			const raw = await readFile(path.join(workDir, 'connection.yaml'), 'utf-8');
			const parsed = yaml.load(raw) as Record<string, unknown>;
			expect(parsed.type).toBe('snowflake');

			// The unedited scaffold must NOT load — the placeholder guard blocks a
			// user from running `dev`/publishing with `<account>` etc. still in place.
			await expect(loadConnectionConfig(workDir)).rejects.toThrow('unfilled <placeholder>');
		});

		it('scaffolds a bigquery connection.yaml with the expected shape', async () => {
			const result = await runInit({ targetDir: null, cwd: workDir, warehouse: 'bigquery' });

			expect(result.warehouse).toBe('bigquery');

			// keyfile points at a path that doesn't exist yet, so loadConnectionConfig
			// would fail on resolve — assert the YAML shape instead.
			const raw = await readFile(path.join(workDir, 'connection.yaml'), 'utf-8');
			const parsed = yaml.load(raw) as Record<string, unknown>;
			expect(parsed.type).toBe('bigquery');
			expect(parsed.project).toBeDefined();
			expect(Array.isArray(parsed.datasets)).toBe(true);
			expect((parsed.datasets as unknown[]).length).toBeGreaterThan(0);
		});

		it('scaffolds a clickhouse connection.yaml that loadConnectionConfig parses', async () => {
			const result = await runInit({ targetDir: null, cwd: workDir, warehouse: 'clickhouse' });

			expect(result.warehouse).toBe('clickhouse');

			// The scaffold (inline password auth) must resolve end-to-end.
			const config = await loadConnectionConfig(workDir);
			expect(config?.type).toBe('clickhouse');
			// Cloud-first defaults: TLS on 8443.
			expect((config as { url: string }).url).toMatch(/^https:.*:8443$/);
		});

		it('scaffolds a fabric connection.yaml with the expected shape', async () => {
			const result = await runInit({ targetDir: null, cwd: workDir, warehouse: 'fabric' });

			expect(result.warehouse).toBe('fabric');

			// The `<server>` placeholder is intentionally not a valid Fabric SQL
			// endpoint host, so loadConnectionConfig would reject it — assert the
			// YAML shape instead.
			const raw = await readFile(path.join(workDir, 'connection.yaml'), 'utf-8');
			const parsed = yaml.load(raw) as Record<string, unknown>;
			expect(parsed.type).toBe('fabric');
			expect(parsed.server).toBeDefined();
			expect(parsed.database).toBeDefined();
			expect(parsed.tenantId).toBeDefined();
			expect(parsed.clientId).toBeDefined();
			expect(parsed.clientSecret).toBeDefined();
		});

		it('writes connection.yaml into a named target directory', async () => {
			await runInit({ targetDir: 'wh-project', cwd: workDir, warehouse: 'snowflake' });

			expect(await exists(path.join(workDir, 'wh-project', 'connection.yaml'))).toBe(true);
		});
	});

	describe('YAML safety for project name', () => {
		it('produces valid YAML when the target directory name contains a double quote', async () => {
			await runInit({ targetDir: 'has"quote', cwd: workDir });

			// loadProjectConfig parsing the file is the real test — if escaping
			// is wrong, js-yaml throws before we get here.
			const cfg = await loadProjectConfig(path.join(workDir, 'has"quote'));
			expect(cfg.project.name).toBe('has"quote');
		});

		it('produces valid YAML when the target directory name contains a backslash', async () => {
			await runInit({ targetDir: 'has\\back', cwd: workDir });

			const cfg = await loadProjectConfig(path.join(workDir, 'has\\back'));
			expect(cfg.project.name).toBe('has\\back');
		});
	});
});
