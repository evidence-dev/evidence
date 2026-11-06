import { describe, expect, it, vi } from 'vitest';
import type { BeforeNavigate } from '@sveltejs/kit';

const { beforeNavigate } = vi.hoisted(() => ({ beforeNavigate: vi.fn() }));
vi.mock('$app/navigation', () => ({ beforeNavigate }));

import { abandonQueriesOnLeave, leavesPage } from './abandon-queries-on-leave';

const target = (path: string) => ({ url: new URL(path, 'http://localhost') });
const navigation = (from: string, to: string, willUnload = false) =>
	({ from: target(from), to: target(to), willUnload }) as unknown as BeforeNavigate;

describe('leavesPage', () => {
	it('is true when moving to another page', () => {
		expect(leavesPage(navigation('/a', '/b'))).toBe(true);
	});

	it('is false when only the query or hash changes', () => {
		expect(leavesPage(navigation('/a', '/a?fullscreen'))).toBe(false);
		expect(leavesPage(navigation('/a', '/a#section'))).toBe(false);
	});

	it('is false for a full unload, which the user can still cancel', () => {
		expect(leavesPage(navigation('/a', '/b', true))).toBe(false);
	});

	it('is false when leaving the app', () => {
		expect(leavesPage({ from: target('/a'), to: null, willUnload: false } as never)).toBe(false);
	});
});

describe('abandonQueriesOnLeave', () => {
	const navigateWith = (nav: BeforeNavigate) => {
		const abandon = vi.fn();
		beforeNavigate.mockClear();
		abandonQueriesOnLeave({ abandon });
		beforeNavigate.mock.calls[0][0](nav);
		return abandon;
	};

	it('abandons queries when the page is left', () => {
		expect(navigateWith(navigation('/a', '/b'))).toHaveBeenCalledOnce();
	});

	it('keeps queries when staying on the page', () => {
		expect(navigateWith(navigation('/a', '/a?x=1'))).not.toHaveBeenCalled();
	});
});
