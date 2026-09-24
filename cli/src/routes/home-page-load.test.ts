import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

// Never read ~/.evd on a developer's machine: the test project is unauthenticated.
vi.mock('$lib/auth/credentials.server', () => ({ loadCredentials: async () => null }));

// Wrap (not replace) `process`: the real pipeline runs, we only observe its options.
vi.mock('$lib/markdown', async (importOriginal) => {
	const mod = await importOriginal<typeof import('$lib/markdown')>();
	return { ...mod, process: vi.fn(mod.process) };
});

import { process as processMarkdown } from '$lib/markdown';
import { load } from './+page.server';

const CONFIG = `project:
  name: Route Test
  evidence: '0.4.6'
pages: ./pages
date:
  first_day_of_week: monday
  default_date_range_end:
    type: relative
    days_ago: 3
`;

const HOME = `---
title: Home
workflow:
  period:
    grain: week
---

# {{ period.label }}
`;

function ymd(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

type HomePageData = Exclude<Awaited<ReturnType<typeof load>>, void>;

function callLoad(): Promise<HomePageData> {
	return load({
		url: new URL('http://localhost/'),
		cookies: { get: () => undefined },
		setHeaders: () => {},
		parent: async () => ({ connectionType: null })
	} as never) as Promise<HomePageData>;
}

let projectDir: string;
let previousCwd: string | undefined;

beforeEach(async () => {
	projectDir = await mkdtemp(path.join(tmpdir(), 'evd-home-route-'));
	await mkdir(path.join(projectDir, 'pages'));
	await writeFile(path.join(projectDir, 'evidence.config.yaml'), CONFIG);
	await writeFile(path.join(projectDir, 'pages', 'home.md'), HOME);
	previousCwd = process.env.EVIDENCE_PROJECT_CWD;
	process.env.EVIDENCE_PROJECT_CWD = projectDir;
	vi.mocked(processMarkdown).mockClear();
});

afterEach(async () => {
	if (previousCwd === undefined) delete process.env.EVIDENCE_PROJECT_CWD;
	else process.env.EVIDENCE_PROJECT_CWD = previousCwd;
	await rm(projectDir, { recursive: true, force: true });
});

describe('home route load — project date settings', () => {
	it('resolves the date: block from evidence.config.yaml into the page data', async () => {
		const data = await callLoad();

		const expectedAnchor = new Date();
		expectedAnchor.setDate(expectedAnchor.getDate() - 3);

		expect(data.projectSettings).toEqual({
			first_day_of_week: 'monday',
			default_date_range_end: { type: 'relative', daysAgo: 3 },
			computedDefaultDateRangeEnd: ymd(expectedAnchor)
		});
	});

	it('passes the same settings to the markdown processor', async () => {
		// Regression: the home route once processed and rendered with default
		// (Sunday / today) settings while every other page used the project's.
		const data = await callLoad();

		expect(processMarkdown).toHaveBeenCalledTimes(1);
		const [, options] = vi.mocked(processMarkdown).mock.calls[0];
		expect(options?.projectSettings?.first_day_of_week).toBe('monday');
		expect(options?.projectSettings).toEqual(data.projectSettings);
	});

	it('resolves page_width and cards from home.md frontmatter like every other page', async () => {
		// Regression: `/` ignored `page_width: full` (and `cards`) while subpages
		// honoured them, because the home route never read page settings.
		await writeFile(
			path.join(projectDir, 'pages', 'home.md'),
			`---\ntitle: Home\npage_width: full\ncards: true\n---\n\n# Wide\n`
		);

		const data = await callLoad();

		expect(data.markdown?.pageSettings).toMatchObject({ page_width: 'full', cards: true });
	});

	it('falls back to the article width when home.md sets no page settings', async () => {
		const data = await callLoad();

		expect(data.markdown?.pageSettings).toMatchObject({ page_width: 'article', cards: false });
	});

	it('degrades to default settings when evidence.config.yaml is malformed', async () => {
		await writeFile(path.join(projectDir, 'evidence.config.yaml'), 'project: [not, an, object]\n');

		const data = await callLoad();

		expect(data.markdown).not.toBeNull();
		expect(data.projectSettings).toMatchObject({
			first_day_of_week: 'sunday',
			computedDefaultDateRangeEnd: ymd(new Date())
		});
	});
});
