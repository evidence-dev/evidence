import { describe, expect, it, vi } from 'vitest';
import type { AfterNavigate } from '@sveltejs/kit';

const { afterNavigate } = vi.hoisted(() => ({ afterNavigate: vi.fn() }));
vi.mock('$app/navigation', () => ({ afterNavigate }));

import { resetScrollOnNavigate, shouldResetScroll } from './scroll-reset';

const target = (path: string) => ({ url: new URL(path, 'http://localhost') });
const navigation = (from: string, to: string) =>
	({ from: target(from), to: target(to) }) as unknown as AfterNavigate;

describe('shouldResetScroll', () => {
	it('resets when moving to another page', () => {
		expect(shouldResetScroll(navigation('/a', '/b'))).toBe(true);
	});

	it('keeps position when only the query changes', () => {
		expect(shouldResetScroll(navigation('/a', '/a?fullscreen'))).toBe(false);
	});

	it('keeps position when the target has a hash', () => {
		expect(shouldResetScroll(navigation('/a', '/b#section'))).toBe(false);
		expect(shouldResetScroll(navigation('/a', '/a#section'))).toBe(false);
	});

	it('keeps position on the initial page load', () => {
		expect(shouldResetScroll({ from: null, to: target('/a') } as unknown as AfterNavigate)).toBe(
			false
		);
	});
});

describe('resetScrollOnNavigate', () => {
	const navigateWith = (viewport: HTMLElement | undefined, nav: AfterNavigate) => {
		afterNavigate.mockClear();
		resetScrollOnNavigate(() => viewport);
		afterNavigate.mock.calls[0][0](nav);
	};

	it('jumps the viewport to the top without smooth scrolling', () => {
		const scrollTo = vi.fn();
		navigateWith({ scrollTo } as unknown as HTMLElement, navigation('/a', '/b'));
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
	});

	it('leaves the viewport alone when the page does not change', () => {
		const scrollTo = vi.fn();
		navigateWith({ scrollTo } as unknown as HTMLElement, navigation('/a', '/a?x=1'));
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it('tolerates layouts without a viewport', () => {
		expect(() => navigateWith(undefined, navigation('/login', '/a'))).not.toThrow();
	});
});
