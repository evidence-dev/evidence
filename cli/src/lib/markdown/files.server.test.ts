import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	discoverProjectComponents,
	discoverProjectPartials,
	getMarkdownFile,
	getNavItems,
	getProjectSignature,
	parsePageSettings,
	resolvePageSettings
} from '$lib/markdown/files.server';

function page(frontmatter: Record<string, string | number>, body = '# Page'): string {
	const fm = Object.entries(frontmatter)
		.map(([k, v]) => `${k}: ${v}`)
		.join('\n');
	return `---\n${fm}\n---\n${body}\n`;
}

describe('getNavItems', () => {
	let cwd: string;

	beforeEach(async () => {
		cwd = await mkdtemp(join(tmpdir(), 'evd-nav-'));
		await mkdir(join(cwd, 'pages'), { recursive: true });
	});

	afterEach(async () => {
		await rm(cwd, { recursive: true, force: true });
	});

	it('orders pages by sidebar_position (home first, positioned before unpositioned)', async () => {
		await writeFile(join(cwd, 'pages', 'home.md'), '# Home\n');
		await writeFile(join(cwd, 'pages', 'apple.md'), page({ sidebar_position: 2 }));
		await writeFile(join(cwd, 'pages', 'banana.md'), page({ sidebar_position: 1 }));
		await writeFile(join(cwd, 'pages', 'zebra.md'), '# Zebra\n'); // no position

		const items = await getNavItems(cwd);

		expect(items.map((i) => i.name)).toEqual(['home', 'banana', 'apple', 'zebra']);
	});

	it('excludes partials from the nav', async () => {
		await writeFile(join(cwd, 'pages', 'real.md'), '# Real\n');
		await writeFile(join(cwd, 'pages', '_frag.md'), page({ type: 'partial' }));

		const items = await getNavItems(cwd);

		expect(items.map((i) => i.slug)).toEqual(['real']);
	});

	it('degrades gracefully when a frontmatter block is a non-object scalar', async () => {
		await writeFile(join(cwd, 'pages', 'ok.md'), '# Ok\n');
		// `---\njust text\n---` parses to a bare string, which z.object() rejects;
		// the page must still appear (no settings) rather than aborting the scan.
		await writeFile(join(cwd, 'pages', 'weird.md'), '---\njust some text\n---\n# Weird\n');

		const items = await getNavItems(cwd);

		expect(items.map((i) => i.slug).sort()).toEqual(['ok', 'weird']);
		expect(items.find((i) => i.slug === 'weird')?.sidebar_position).toBeUndefined();
	});

	it('only treats root-level home/index/README as home, not nested files with those names', async () => {
		// Two pages both named `index.md` — one at pages/, one nested. Only the
		// root one should be flagged home; otherwise both map to `/` in the nav
		// and the sidebar's keyed each crashes with each_key_duplicate.
		await writeFile(join(cwd, 'pages', 'index.md'), '# Root Home\n');
		await mkdir(join(cwd, 'pages', 'sub'), { recursive: true });
		await writeFile(join(cwd, 'pages', 'sub', 'index.md'), '# Nested\n');

		const items = await getNavItems(cwd);

		const root = items.find((i) => i.slug === 'index');
		const nested = items.find((i) => i.slug === 'sub/index');
		expect(root?.isHome).toBe(true);
		expect(nested?.isHome).toBe(false);
	});

	it('marks only one root home-candidate as home when multiple are present (home → index → README)', async () => {
		// `getHomeFile` picks home > index > README; the sidebar must agree so
		// only one entry emits href '/'. Otherwise PageNavTree crashes with
		// each_key_duplicate on the second root page keyed by href.
		await writeFile(join(cwd, 'pages', 'home.md'), '# Home\n');
		await writeFile(join(cwd, 'pages', 'index.md'), '# Index\n');
		await writeFile(join(cwd, 'pages', 'README.md'), '# Readme\n');

		const items = await getNavItems(cwd);

		const home = items.find((i) => i.slug === 'home');
		const index = items.find((i) => i.slug === 'index');
		const readme = items.find((i) => i.slug === 'README');
		expect(home?.isHome).toBe(true);
		expect(index?.isHome).toBe(false);
		expect(readme?.isHome).toBe(false);
		expect(items.filter((i) => i.isHome)).toHaveLength(1);
	});

	it('falls through to index when home.md is absent', async () => {
		await writeFile(join(cwd, 'pages', 'index.md'), '# Index\n');
		await writeFile(join(cwd, 'pages', 'README.md'), '# Readme\n');

		const items = await getNavItems(cwd);

		expect(items.find((i) => i.slug === 'index')?.isHome).toBe(true);
		expect(items.find((i) => i.slug === 'README')?.isHome).toBe(false);
	});

	it('reads title, sidebar_position and icon from frontmatter', async () => {
		await writeFile(
			join(cwd, 'pages', 'orders.md'),
			page({ title: 'Orders', sidebar_position: 3, icon: 'shopping-cart' })
		);

		const [item] = await getNavItems(cwd);

		expect(item).toMatchObject({
			slug: 'orders',
			title: 'Orders',
			sidebar_position: 3,
			icon: 'shopping-cart'
		});
	});
});

describe('getMarkdownFile', () => {
	let cwd: string;

	beforeEach(async () => {
		cwd = await mkdtemp(join(tmpdir(), 'evd-markdown-'));
		await mkdir(join(cwd, 'pages'), { recursive: true });
	});

	afterEach(async () => {
		await rm(cwd, { recursive: true, force: true });
	});

	it('reads nested markdown files within the pages directory', async () => {
		await mkdir(join(cwd, 'pages', 'nested'));
		await writeFile(join(cwd, 'pages', 'nested', 'orders.md'), '# Orders\n');

		const file = await getMarkdownFile(cwd, 'nested/orders');

		expect(file?.content).toBe('# Orders\n');
	});

	it.each(['../outside', '..\\outside'])('rejects traversal slug %s', async (slug) => {
		await writeFile(join(cwd, 'pages', `${slug}.md`), '# Outside\n');

		const file = await getMarkdownFile(cwd, slug);

		expect(file).toBeNull();
	});
});

describe('parsePageSettings', () => {
	it('reads cards from frontmatter', () => {
		expect(parsePageSettings('---\ncards: true\n---\n# Page\n')).toEqual({ cards: true });
	});

	it('returns no settings when there is no frontmatter', () => {
		expect(parsePageSettings('# Just a page\n')).toEqual({});
	});

	it('coerces a stringified boolean for cards', () => {
		expect(parsePageSettings('---\ncards: "true"\n---\n# Page\n')).toEqual({ cards: true });
	});

	it('maps page_width, table_of_contents and auto_refresh', () => {
		const settings = parsePageSettings(
			'---\npage_width: full\ntable_of_contents: true\nauto_refresh: 30\n---\n# Page\n'
		);
		expect(settings).toEqual({
			page_width: 'full',
			table_of_contents: true,
			auto_refresh: 30
		});
	});

	it('omits absent keys so they inherit defaults', () => {
		expect(parsePageSettings('---\ntitle: Orders\n---\n# Page\n')).toEqual({});
	});
});

describe('resolvePageSettings', () => {
	it('falls back to Evidence defaults with no layout and no frontmatter', () => {
		expect(resolvePageSettings('# Page\n', null)).toEqual({
			page_width: 'article',
			cards: false,
			table_of_contents: false
		});
	});

	it('applies project layout defaults when the page sets nothing', () => {
		expect(resolvePageSettings('# Page\n', { cards: true, page_width: 'full' })).toEqual({
			page_width: 'full',
			cards: true,
			table_of_contents: false
		});
	});

	it('lets explicit page frontmatter override the project layout', () => {
		const settings = resolvePageSettings('---\ncards: false\n---\n# Page\n', { cards: true });
		expect(settings.cards).toBe(false);
	});

	it('merges auto_refresh from the project layout', () => {
		expect(resolvePageSettings('# Page\n', { auto_refresh: 60 })).toMatchObject({
			auto_refresh: 60
		});
	});
});

describe('discoverProjectComponents', () => {
	let cwd: string;

	beforeEach(async () => {
		cwd = await mkdtemp(join(tmpdir(), 'evd-components-'));
		await mkdir(join(cwd, 'pages'), { recursive: true });
		await mkdir(join(cwd, 'components'), { recursive: true });
	});

	afterEach(async () => {
		await rm(cwd, { recursive: true, force: true });
	});

	it('treats a marker-less file in components/ as a component', async () => {
		await writeFile(join(cwd, 'components', 'kpi_card.md'), '# no frontmatter at all\n');
		expect(Object.keys(await discoverProjectComponents(cwd))).toEqual(['components/kpi_card']);
	});

	it('still recognises an explicit type: component in components/', async () => {
		await writeFile(join(cwd, 'components', 'kpi_card.md'), page({ type: 'component' }));
		expect(Object.keys(await discoverProjectComponents(cwd))).toEqual(['components/kpi_card']);
	});

	it('honours an explicit non-component type inside components/', async () => {
		await writeFile(join(cwd, 'components', 'notes.md'), page({ type: 'page' }));
		await writeFile(join(cwd, 'components', 'footer.md'), page({ type: 'partial' }));
		expect(await discoverProjectComponents(cwd)).toEqual({});
	});

	it('requires the marker for a component colocated in pages/', async () => {
		await writeFile(join(cwd, 'pages', 'marked.md'), page({ type: 'component' }));
		await writeFile(join(cwd, 'pages', 'unmarked.md'), '# just a page\n');
		expect(Object.keys(await discoverProjectComponents(cwd))).toEqual(['pages/marked']);
	});

	it('does not treat a nested user folder named components/ as the reserved one', async () => {
		await mkdir(join(cwd, 'pages', 'components'), { recursive: true });
		await writeFile(join(cwd, 'pages', 'components', 'nope.md'), '# a page\n');
		expect(await discoverProjectComponents(cwd)).toEqual({});
	});
});

describe('discoverProjectPartials', () => {
	let cwd: string;

	beforeEach(async () => {
		cwd = await mkdtemp(join(tmpdir(), 'evd-partials-'));
		await mkdir(join(cwd, 'pages'), { recursive: true });
		await mkdir(join(cwd, 'partials'), { recursive: true });
	});

	afterEach(async () => {
		await rm(cwd, { recursive: true, force: true });
	});

	it('treats a marker-less file in partials/ as a partial', async () => {
		await writeFile(join(cwd, 'partials', 'footer.md'), '# footer\n');
		expect(Object.keys(await discoverProjectPartials(cwd))).toEqual(['partials/footer']);
	});

	it('honours an explicit non-partial type inside partials/', async () => {
		await writeFile(join(cwd, 'partials', 'widget.md'), page({ type: 'component' }));
		expect(await discoverProjectPartials(cwd)).toEqual({});
	});

	it('requires the marker for a partial colocated in pages/', async () => {
		await writeFile(join(cwd, 'pages', 'marked.md'), page({ type: 'partial' }));
		await writeFile(join(cwd, 'pages', 'unmarked.md'), '# just a page\n');
		expect(Object.keys(await discoverProjectPartials(cwd))).toEqual(['pages/marked']);
	});
});

describe('getProjectSignature', () => {
	let cwd: string;

	beforeEach(async () => {
		cwd = await mkdtemp(join(tmpdir(), 'evd-signature-'));
		await mkdir(join(cwd, 'pages'), { recursive: true });
		await mkdir(join(cwd, 'components'), { recursive: true });
	});

	afterEach(async () => {
		await rm(cwd, { recursive: true, force: true });
	});

	it('changes when a component file changes', async () => {
		const file = join(cwd, 'components', 'kpi_card.md');
		await writeFile(file, page({ type: 'component' }, 'v1'));
		const before = await getProjectSignature(cwd);

		await new Promise((resolve) => setTimeout(resolve, 10));
		await writeFile(file, page({ type: 'component' }, 'v2'));
		const after = await getProjectSignature(cwd);

		expect(after).not.toBe(before);
	});
});
