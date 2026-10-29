// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync, tick } from 'svelte';
import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';
import TableOfContents from './TableOfContents.svelte';
import { registerRendererOutline } from '../user-components/Renderer/tree-registry';
import { resolveOutline } from '../print-outline/resolve-outline';
import { headingSectionKey, type RepeatIteration } from '../print-outline/section-key';
import { Filters } from '../Filters.svelte';
import { InlineQueries } from '../user-components/common/inline-queries';
import { defaultDialect } from '../sql-dialect';
import type { Connection } from '../connection/types';

const mounted: ReturnType<typeof mount>[] = [];

afterEach(() => {
	mounted.splice(0).forEach((component) => unmount(component));
	document.body.innerHTML = '';
});

const tag = (name: string, attributes: Record<string, unknown>, children: RenderableTreeNode[]) =>
	new Markdoc.Tag(name, attributes, children);
const h2 = (id: string, ...children: RenderableTreeNode[]) =>
	tag('h2', { 'data-heading-id': id }, children);

const connection: Connection = {
	id: 'default',
	type: 'managed',
	dialect: defaultDialect,
	async query() {
		return { rows: [{ value: 'East' }, { value: 'West' }], columns: [], error: null } as never;
	}
};

// Mirrors what Renderer does: the outline comes from the tree, the DOM only provides anchors.
function renderPage(tree: RenderableTreeNode, mountedHeadings: [string, RepeatIteration[]][]) {
	const root = document.createElement('div');
	root.className = 'prose';
	root.setAttribute('data-markdoc-content', '');
	for (const [headingId, chain] of mountedHeadings) {
		const el = document.createElement('h2');
		el.setAttribute('data-section-key', headingSectionKey(headingId, chain));
		root.appendChild(el);
	}
	document.body.appendChild(root);

	const pageFilters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: () => defaultDialect
	});
	const deps = {
		pageFilters,
		inlineQueries: new InlineQueries({ filterContexts: [pageFilters] }),
		defaultConnection: connection,
		connectionFor: () => connection
	};
	registerRendererOutline(root, (mode) => resolveOutline(tree, deps, mode));
}

async function tocLinks() {
	const toc = document.createElement('div');
	document.body.appendChild(toc);
	mounted.push(mount(TableOfContents, { target: toc }));
	// The outline resolves asynchronously (repeat queries); let it settle.
	for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
	await tick();
	flushSync();
	return [...toc.querySelectorAll('a')].map((a) => a.textContent?.trim());
}

describe('TableOfContents', () => {
	it('omits headings inside print-only content', async () => {
		const tree = tag('article', {}, [
			h2('screen', 'On screen'),
			tag('print_group', { print_only: true }, [h2('pg', 'Print group')]),
			tag('only_in_print', {}, [h2('oip', 'Print appendix')])
		]);
		renderPage(tree, [
			['screen', []],
			['pg', []],
			['oip', []]
		]);

		expect(await tocLinks()).toEqual(['On screen']);
	});

	it('lists each repeat iteration with its resolved label', async () => {
		const tree = tag('article', {}, [
			tag('repeat', { id: 'region', data: 'orders', column: 'region' }, [
				h2('region-h', 'Region ', tag('ReactiveVariable', { expression: 'region' }, []))
			])
		]);
		const east = [{ id: 'region', value: 'East' }];
		const west = [{ id: 'region', value: 'West' }];
		renderPage(tree, [
			['region-h', east],
			['region-h', west]
		]);

		expect(await tocLinks()).toEqual(['Region East', 'Region West']);
	});

	it('skips sections that are not mounted', async () => {
		const tree = tag('article', {}, [h2('a', 'Mounted'), h2('b', 'Inactive tab')]);
		renderPage(tree, [['a', []]]);

		expect(await tocLinks()).toEqual(['Mounted']);
	});

	it('never resolves the outline concurrently while retrying', async () => {
		const root = document.createElement('div');
		root.setAttribute('data-markdoc-content', '');
		document.body.appendChild(root);
		let inFlight = 0;
		let maxInFlight = 0;
		let calls = 0;
		registerRendererOutline(root, async () => {
			calls++;
			maxInFlight = Math.max(maxInFlight, ++inFlight);
			await new Promise((r) => setTimeout(r, 400));
			inFlight--;
			return [];
		});

		const toc = document.createElement('div');
		document.body.appendChild(toc);
		mounted.push(mount(TableOfContents, { target: toc }));
		await new Promise((r) => setTimeout(r, 1500));

		expect(calls).toBeGreaterThan(1);
		expect(maxInFlight).toBe(1);
	});

	it('stops resolving once unmounted', async () => {
		const root = document.createElement('div');
		root.setAttribute('data-markdoc-content', '');
		document.body.appendChild(root);
		let calls = 0;
		registerRendererOutline(root, async () => {
			calls++;
			await new Promise((r) => setTimeout(r, 200));
			return [];
		});

		const toc = document.createElement('div');
		document.body.appendChild(toc);
		const component = mount(TableOfContents, { target: toc });
		// Let a retry queue up behind the in-flight run, then leave the page.
		await new Promise((r) => setTimeout(r, 100));
		unmount(component);
		const callsAtUnmount = calls;
		await new Promise((r) => setTimeout(r, 600));

		expect(calls).toBe(callsAtUnmount);
	});
});
