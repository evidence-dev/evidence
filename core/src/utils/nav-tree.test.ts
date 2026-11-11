import { describe, it, expect } from 'vitest';
import { compareSidebarPosition, buildNavTreeFromFlat, type FlatNavItem } from './nav-tree';

describe('compareSidebarPosition', () => {
	it('orders by position ascending when both are set', () => {
		expect(compareSidebarPosition(1, 2, 'b', 'a')).toBeLessThan(0);
		expect(compareSidebarPosition(5, 2, 'a', 'b')).toBeGreaterThan(0);
	});

	it('breaks position ties by name', () => {
		expect(compareSidebarPosition(1, 1, 'alpha', 'beta')).toBeLessThan(0);
		expect(compareSidebarPosition(1, 1, 'beta', 'alpha')).toBeGreaterThan(0);
	});

	it('sorts a positioned page before an unpositioned one', () => {
		expect(compareSidebarPosition(3, null, 'z', 'a')).toBeLessThan(0);
		expect(compareSidebarPosition(undefined, 3, 'a', 'z')).toBeGreaterThan(0);
	});

	it('falls back to name when neither is set', () => {
		expect(compareSidebarPosition(null, undefined, 'apple', 'banana')).toBeLessThan(0);
		expect(compareSidebarPosition(undefined, null, 'banana', 'apple')).toBeGreaterThan(0);
	});
});

describe('buildNavTreeFromFlat', () => {
	it('prefers frontmatter title over the deslugified filename and carries icons', () => {
		const items: FlatNavItem[] = [
			{ name: 'home', slug: 'home', isHome: true, title: 'Welcome' },
			{ name: 'my_orders', slug: 'my_orders', isHome: false, icon: 'box' },
			{ name: 'revenue', slug: 'revenue', isHome: false, title: 'Top Line' }
		];

		const tree = buildNavTreeFromFlat(items);

		expect(tree.rootPages).toEqual([
			{ name: 'Welcome', href: '/', icon: null },
			{ name: 'My Orders', href: '/my_orders', icon: 'box' },
			{ name: 'Top Line', href: '/revenue', icon: null }
		]);
		expect(tree.directories).toEqual([]);
	});

	it('dedupes duplicate hrefs so PageNavTree keys never collide', () => {
		// Belt-and-suspenders: if a caller ever produces two items that resolve
		// to the same href, keep the first and drop the rest instead of letting
		// PageNavTree crash with each_key_duplicate.
		const items: FlatNavItem[] = [
			{ name: 'home', slug: 'home', isHome: true, title: 'Home' },
			{ name: 'index', slug: 'index', isHome: true, title: 'Index' },
			{ name: 'orders', slug: 'orders', isHome: false },
			{ name: 'orders', slug: 'orders', isHome: false }
		];

		const tree = buildNavTreeFromFlat(items);

		expect(tree.rootPages.map((p) => p.href)).toEqual(['/', '/orders']);
	});

	it('preserves input order within root pages and directories', () => {
		const items: FlatNavItem[] = [
			{ name: 'b', slug: 'b', isHome: false },
			{ name: 'a', slug: 'a', isHome: false },
			{ name: 'second', slug: 'sales/second', isHome: false },
			{ name: 'first', slug: 'sales/first', isHome: false }
		];

		const tree = buildNavTreeFromFlat(items);

		expect(tree.rootPages.map((p) => p.href)).toEqual(['/b', '/a']);
		expect(tree.directories).toHaveLength(1);
		expect(tree.directories[0].name).toBe('Sales');
		expect(tree.directories[0].pages.map((p) => p.href)).toEqual(['/sales/second', '/sales/first']);
	});

	it("nests folders to any depth, with sub-folders after a folder's pages", () => {
		const items: FlatNavItem[] = [
			{ name: 'overview', slug: 'sales/overview', isHome: false },
			{ name: 'paid', slug: 'sales/regions/emea/paid', isHome: false },
			{ name: 'north', slug: 'sales/regions/north', isHome: false },
			{ name: 'summary', slug: 'sales/summary', isHome: false }
		];

		const [sales] = buildNavTreeFromFlat(items).directories;

		expect(sales.pages.map((p) => p.href)).toEqual(['/sales/overview', '/sales/summary']);
		expect(sales.directories?.map((d) => d.id)).toEqual(['sales/regions']);
		const regions = sales.directories![0];
		expect(regions.name).toBe('Regions');
		expect(regions.pages.map((p) => p.href)).toEqual(['/sales/regions/north']);
		expect(regions.directories?.[0].pages.map((p) => p.href)).toEqual(['/sales/regions/emea/paid']);
	});

	it("turns a folder's index.md into the folder's link and label", () => {
		const items: FlatNavItem[] = [
			{
				name: 'index',
				slug: 'health/index',
				isHome: false,
				title: 'Business Health',
				icon: 'heart'
			},
			{
				name: 'index',
				slug: 'health/growth/index',
				isHome: false,
				title: 'Growth'
			},
			{
				name: 'paid-ua',
				slug: 'health/growth/paid-ua',
				isHome: false,
				title: 'Paid UA'
			},
			{ name: 'index', slug: 'health/data/index', isHome: false }
		];

		const [health] = buildNavTreeFromFlat(items).directories;

		expect(health).toMatchObject({
			name: 'Business Health',
			href: '/health',
			icon: 'heart',
			pages: []
		});
		const [growth, data] = health.directories!;
		expect(growth).toMatchObject({ name: 'Growth', href: '/health/growth' });
		expect(growth.pages).toEqual([{ name: 'Paid UA', href: '/health/growth/paid-ua', icon: null }]);
		// No title: the folder keeps its deslugified name.
		expect(data).toMatchObject({
			name: 'Data',
			href: '/health/data',
			pages: []
		});
	});
});
