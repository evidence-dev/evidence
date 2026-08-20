import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
	loadProjectConfig,
	loadProjectTheme,
	loadProjectTranslations,
	ProjectConfigError
} from './load-config.ts';

let projectRoot: string;

beforeEach(async () => {
	projectRoot = await mkdtemp(path.join(tmpdir(), 'evidence-config-test-'));
});

afterEach(async () => {
	await rm(projectRoot, { recursive: true, force: true });
});

describe('loadProjectConfig', () => {
	describe('when evidence.config.yaml is absent', () => {
		it('returns a default config marked as legacy', async () => {
			const cfg = await loadProjectConfig(projectRoot);

			expect(cfg.isDefaultConfig).toBe(true);
			expect(cfg.configPath).toBeNull();
			expect(cfg.project.evidence).toBeNull();
			expect(cfg.project.name).toBe(path.basename(projectRoot));
			expect(cfg.pages).toBe('./pages');
			expect(cfg.pagesDir).toBe(path.resolve(projectRoot, 'pages'));
			expect(cfg.theme).toBeUndefined();
			expect(cfg.translations).toEqual({});
		});
	});

	describe('when evidence.config.yaml is well-formed', () => {
		beforeEach(async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\npages: ./pages\n`,
				'utf-8'
			);
		});

		it('parses project.name and evidence version', async () => {
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.project.name).toBe('My Project');
			expect(cfg.project.evidence).toBe('0.4.3');
		});

		it('marks isDefaultConfig false and sets configPath', async () => {
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.isDefaultConfig).toBe(false);
			expect(cfg.configPath).toBe(path.join(projectRoot, 'evidence.config.yaml'));
		});

		it('preserves the relative `pages` value and resolves pagesDir', async () => {
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.pages).toBe('./pages');
			expect(cfg.pagesDir).toBe(path.resolve(projectRoot, 'pages'));
		});

		it('defaults `pages` to ./pages when omitted', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.pages).toBe('./pages');
			expect(cfg.pagesDir).toBe(path.resolve(projectRoot, 'pages'));
		});

		it('leaves layout undefined when no layout block is present', async () => {
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.layout).toBeUndefined();
		});

		it('parses the layout block', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\nlayout:\n  cards: true\n  page_width: full\n  auto_refresh: 30\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.layout).toEqual({ cards: true, page_width: 'full', auto_refresh: 30 });
		});

		it('degrades a malformed layout value to undefined rather than throwing', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\nlayout:\n  cards: "not a boolean"\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.layout).toBeUndefined();
		});

		it('leaves date undefined when no date block is present', async () => {
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.date).toBeUndefined();
		});

		it('parses the date block (first_day_of_week + relative range end)', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\ndate:\n  first_day_of_week: monday\n  default_date_range_end:\n    type: relative\n    days_ago: 7\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.date).toEqual({
				first_day_of_week: 'monday',
				default_date_range_end: { type: 'relative', days_ago: 7 }
			});
		});

		it('degrades a malformed date value to undefined rather than throwing', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\ndate:\n  first_day_of_week: someday\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.date).toBeUndefined();
		});

		it('honours a custom `pages` path', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: x\n  evidence: "0.4.3"\npages: ./content\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.pages).toBe('./content');
			expect(cfg.pagesDir).toBe(path.resolve(projectRoot, 'content'));
		});
	});

	describe('validation errors', () => {
		it('throws ProjectConfigError when YAML is malformed', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: "unterminated\n  format: 2\n`,
				'utf-8'
			);
			await expect(loadProjectConfig(projectRoot)).rejects.toThrow(ProjectConfigError);
		});

		it('throws when project.evidence is missing', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: x\n`,
				'utf-8'
			);
			await expect(loadProjectConfig(projectRoot)).rejects.toThrow(/evidence/);
		});

		it('throws when project.evidence is not a string', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: x\n  evidence: 2\n`,
				'utf-8'
			);
			await expect(loadProjectConfig(projectRoot)).rejects.toThrow(/evidence/);
		});

		it('throws when project.name is missing', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await expect(loadProjectConfig(projectRoot)).rejects.toThrow(/name/);
		});

		it('throws when the top-level is not an object', async () => {
			await writeFile(path.join(projectRoot, 'evidence.config.yaml'), `"just a string"\n`, 'utf-8');
			await expect(loadProjectConfig(projectRoot)).rejects.toThrow(ProjectConfigError);
		});

		it('mentions `evidence` (not `format`) when the project block is missing or invalid', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project: "not an object"\n`,
				'utf-8'
			);
			const err = await loadProjectConfig(projectRoot).catch((e) => e as Error);
			expect(err).toBeInstanceOf(ProjectConfigError);
			expect((err as Error).message).toContain('evidence');
			expect((err as Error).message).not.toContain('format');
		});

		it('includes the config file path in the error message', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: x\n`,
				'utf-8'
			);
			await expect(loadProjectConfig(projectRoot)).rejects.toThrow(
				new RegExp(
					path.join(projectRoot, 'evidence.config.yaml').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
				)
			);
		});
	});

	describe('theme.yaml loading', () => {
		it('loads theme.yaml when present and well-formed', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await writeFile(
				path.join(projectRoot, 'theme.yaml'),
				`colors:\n  base:\n    light: "#ffffff"\n    dark: "#000000"\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.theme).toBeDefined();
			expect(cfg.theme?.colors).toBeDefined();
		});

		it('returns undefined when theme.yaml is absent', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.theme).toBeUndefined();
		});

		it('gracefully degrades when theme.yaml is malformed', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await writeFile(
				path.join(projectRoot, 'theme.yaml'),
				`colors:\n  base: "invalid"\n    light: ": unterminated`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.theme).toBeUndefined();
		});

		it('gracefully degrades when theme.yaml is not an object', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await writeFile(path.join(projectRoot, 'theme.yaml'), `"just a string"\n`, 'utf-8');
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.theme).toBeUndefined();
		});
	});

	describe('translations.yaml loading', () => {
		it('loads translations.yaml when present and well-formed', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await writeFile(
				path.join(projectRoot, 'translations.yaml'),
				`en:\n  greeting: "Hello"\nes:\n  greeting: "Hola"\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.translations).toBeDefined();
			expect(cfg.translations.en).toBeDefined();
		});

		it('returns empty object when translations.yaml is absent', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.translations).toEqual({});
		});

		it('gracefully degrades when translations.yaml is malformed', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await writeFile(
				path.join(projectRoot, 'translations.yaml'),
				`en:\n  greeting: "Hello\n    unterminated`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.translations).toEqual({});
		});

		it('gracefully degrades when translations.yaml is not an object', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await writeFile(path.join(projectRoot, 'translations.yaml'), `["array"]\n`, 'utf-8');
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.translations).toEqual({});
		});

		it('keeps numeric/boolean-like values as strings when loading', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: My Project\n  evidence: "0.4.3"\n`,
				'utf-8'
			);
			await writeFile(
				path.join(projectRoot, 'translations.yaml'),
				`values:\n  year: 2024\n  flag: on\n`,
				'utf-8'
			);
			const cfg = await loadProjectConfig(projectRoot);
			expect(cfg.translations.values).toBeDefined();
		});
	});

	// theme.yaml / translations.yaml must not be suppressed by an unrelated broken
	// evidence.config.yaml — loadProjectConfig throws there, so callers read the
	// sibling files via these standalone loaders.
	describe('standalone sibling loaders (independent of evidence.config.yaml)', () => {
		it('loadProjectTheme reads theme.yaml even when evidence.config.yaml is malformed', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: "unterminated\n`,
				'utf-8'
			);
			await writeFile(
				path.join(projectRoot, 'theme.yaml'),
				`colors:\n  base:\n    light: "#ffffff"\n    dark: "#000000"\n`,
				'utf-8'
			);
			// Sanity: the config itself is unparseable.
			await expect(loadProjectConfig(projectRoot)).rejects.toThrow(ProjectConfigError);

			const theme = await loadProjectTheme(projectRoot);
			expect(theme?.colors).toBeDefined();
		});

		it('loadProjectTranslations reads translations.yaml even when evidence.config.yaml is malformed', async () => {
			await writeFile(
				path.join(projectRoot, 'evidence.config.yaml'),
				`project:\n  name: "unterminated\n`,
				'utf-8'
			);
			await writeFile(
				path.join(projectRoot, 'translations.yaml'),
				`en:\n  greeting: "Hello"\n`,
				'utf-8'
			);
			const translations = await loadProjectTranslations(projectRoot);
			expect(translations.en).toBeDefined();
		});

		it('loadProjectTheme returns undefined when theme.yaml is absent', async () => {
			expect(await loadProjectTheme(projectRoot)).toBeUndefined();
		});

		it('loadProjectTranslations returns an empty object when translations.yaml is absent', async () => {
			expect(await loadProjectTranslations(projectRoot)).toEqual({});
		});
	});
});
