// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyLinkClick, installLinkClickHandler } from './link-clicks';

function mountLink(attrs: Record<string, string>, inner = 'go'): HTMLAnchorElement {
	const a = document.createElement('a');
	for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
	a.innerHTML = inner;
	document.body.appendChild(a);
	return a;
}

function click(target: Element, init: MouseEventInit = {}): MouseEvent {
	const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
	target.dispatchEvent(event);
	return event;
}

// Classify a dispatched click, then cancel it so jsdom doesn't try to
// navigate (it logs "Not implemented: navigation" for un-prevented links).
function classify(target: Element, init: MouseEventInit = {}) {
	let action: ReturnType<typeof classifyLinkClick> | undefined;
	document.addEventListener(
		'click',
		(e) => {
			action = classifyLinkClick(e);
			e.preventDefault();
		},
		{ once: true }
	);
	click(target, init);
	return action;
}

// Click with a trailing observer on window (registered after the handler
// under test, so it runs after it) that records whether the handler cancelled
// the click, then cancels it itself to keep jsdom from attempting a navigation.
function clickAndObserve(target: Element): boolean {
	let preventedByHandler = false;
	window.addEventListener(
		'click',
		(e) => {
			preventedByHandler = e.defaultPrevented;
			e.preventDefault();
		},
		{ once: true }
	);
	click(target);
	return preventedByHandler;
}

afterEach(() => {
	document.body.innerHTML = '';
});

describe('classifyLinkClick', () => {
	it('sends an absolute http(s) link to a new tab', () => {
		const a = mountLink({ href: 'https://support.example.com/ticket/42' });
		expect(classify(a)).toEqual({ kind: 'new-tab', url: 'https://support.example.com/ticket/42' });
	});

	it('sends target=_blank to a new tab too — the frame cannot open it natively', () => {
		const a = mountLink({ href: 'https://example.com/x', target: '_blank' });
		expect(classify(a)).toEqual({ kind: 'new-tab', url: 'https://example.com/x' });
	});

	it('sends a target=_blank app path to a new tab (parent resolves it)', () => {
		const a = mountLink({ href: '/proj/page', target: '_BLANK' });
		expect(classify(a)).toEqual({ kind: 'new-tab', url: '/proj/page' });
	});

	it('resolves a click on a child of the anchor (icon, span) to the anchor', () => {
		const a = mountLink({ href: 'https://example.com' }, '<span><b>deep</b></span>');
		expect(classify(a.querySelector('b')!)).toEqual({
			kind: 'new-tab',
			url: 'https://example.com'
		});
	});

	it('sends a root-relative app path to navigate (same-tab drill-through)', () => {
		const a = mountLink({ href: '/my-project/reports/detail?tab=1' });
		expect(classify(a)).toEqual({ kind: 'same-tab', path: '/my-project/reports/detail?tab=1' });
	});

	it.each([
		['download link', { href: 'https://example.com/report.csv', download: '' }],
		['fragment anchor', { href: '#section' }],
		['empty href', { href: '' }],
		['mailto', { href: 'mailto:x@y.com' }],
		['javascript scheme', { href: 'javascript:alert(1)' }],
		['protocol-relative host', { href: '//evil.com/x' }],
		['relative path', { href: 'other.html' }],
		['unsafe internal path (backslash)', { href: '/a\\b' }]
	])('ignores: %s', (_label, attrs) => {
		const a = mountLink(attrs);
		expect(classify(a)).toEqual({ kind: 'ignore' });
	});

	it.each([
		['meta', { metaKey: true }],
		['ctrl', { ctrlKey: true }],
		['shift', { shiftKey: true }],
		['alt', { altKey: true }],
		['middle button', { button: 1 }]
	])('ignores modifier/middle clicks (%s) so the browser affordance wins', (_label, init) => {
		const a = mountLink({ href: 'https://example.com' });
		expect(classify(a, init)).toEqual({ kind: 'ignore' });
	});

	it('ignores a click the author already preventDefault()ed', () => {
		const a = mountLink({ href: 'https://example.com' });
		a.addEventListener('click', (e) => e.preventDefault());
		expect(classify(a)).toEqual({ kind: 'ignore' });
	});

	it('ignores clicks that are not on a link', () => {
		const div = document.createElement('div');
		document.body.appendChild(div);
		expect(classify(div)).toEqual({ kind: 'ignore' });
	});
});

describe('installLinkClickHandler', () => {
	it('prevents the frame navigation and dispatches new-tab / same-tab', () => {
		const openNewTab = vi.fn();
		const navigateSameTab = vi.fn();
		const uninstall = installLinkClickHandler(window, { openNewTab, navigateSameTab });

		const ext = click(mountLink({ href: 'https://example.com/a' }));
		expect(ext.defaultPrevented).toBe(true);
		expect(openNewTab).toHaveBeenCalledWith('https://example.com/a');

		const int = click(mountLink({ href: '/proj/page' }));
		expect(int.defaultPrevented).toBe(true);
		expect(navigateSameTab).toHaveBeenCalledWith('/proj/page');

		uninstall();
	});

	it('lets an author handler on document cancel the link first (listener is on window)', () => {
		// An author's `document.addEventListener('click', …)` registers AFTER the
		// runtime's listener; bubbling document → window still runs it first.
		const openNewTab = vi.fn();
		const uninstall = installLinkClickHandler(window, {
			openNewTab,
			navigateSameTab: vi.fn()
		});
		const cancel = (e: Event) => e.preventDefault();
		document.addEventListener('click', cancel);
		try {
			click(mountLink({ href: 'https://example.com/cancelled' }));
			expect(openNewTab).not.toHaveBeenCalled();
		} finally {
			document.removeEventListener('click', cancel);
			uninstall();
		}
	});

	it('leaves ignored clicks untouched (no preventDefault, no handler call)', () => {
		const openNewTab = vi.fn();
		const navigateSameTab = vi.fn();
		const uninstall = installLinkClickHandler(window, { openNewTab, navigateSameTab });

		const prevented = clickAndObserve(mountLink({ href: 'mailto:x@y.com' }));
		expect(prevented).toBe(false);
		expect(openNewTab).not.toHaveBeenCalled();
		expect(navigateSameTab).not.toHaveBeenCalled();

		uninstall();
	});

	it('stops handling after uninstall', () => {
		const openNewTab = vi.fn();
		const uninstall = installLinkClickHandler(window, {
			openNewTab,
			navigateSameTab: vi.fn()
		});
		uninstall();
		const prevented = clickAndObserve(mountLink({ href: 'https://example.com' }));
		expect(prevented).toBe(false);
		expect(openNewTab).not.toHaveBeenCalled();
	});
});
