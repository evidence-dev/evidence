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
});
