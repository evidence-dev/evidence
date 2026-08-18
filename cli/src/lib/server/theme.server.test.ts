import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveProjectTheme, resolvePageTheme } from '$lib/server/theme.server';

const PROJECT_BASE = '#112233';
const PAGE_BASE = '#445566';

const projectThemeYaml = `colors:
  base:
    light: "${PROJECT_BASE}"
    dark: "${PROJECT_BASE}"
`;

function pageWithThemeBase(hex: string): string {
	return `---
title: Demo
theme:
  colors:
    base:
      light: "${hex}"
      dark: "${hex}"
---
# Demo
`;
}

describe('CLI theme resolution', () => {
	let cwd: string;

	beforeEach(async () => {
		cwd = await mkdtemp(join(tmpdir(), 'evd-theme-'));
		await writeFile(join(cwd, 'theme.yaml'), projectThemeYaml);
	});

	afterEach(async () => {
		await rm(cwd, { recursive: true, force: true });
	});

	it('resolves the project base color from theme.yaml', async () => {
		const theme = await resolveProjectTheme(cwd);
		expect(theme.colors.base.light).toBe(PROJECT_BASE);
	});

	it('lets a page frontmatter theme override the project theme', async () => {
		const theme = await resolvePageTheme(cwd, pageWithThemeBase(PAGE_BASE));
		expect(theme.colors.base.light).toBe(PAGE_BASE);
		expect(theme.colors.base.dark).toBe(PAGE_BASE);
	});

	it('falls back to the project theme when a page has no frontmatter theme', async () => {
		const theme = await resolvePageTheme(cwd, '# No frontmatter here\n');
		expect(theme.colors.base.light).toBe(PROJECT_BASE);
	});

	it('falls back to the project theme when frontmatter theme is invalid', async () => {
		const page = `---
theme:
  colors:
    base:
      light: not-a-hex-color
---
# Bad theme
`;
		const theme = await resolvePageTheme(cwd, page);
		expect(theme.colors.base.light).toBe(PROJECT_BASE);
	});
});
