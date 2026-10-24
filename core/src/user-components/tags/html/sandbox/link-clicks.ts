/**
 * Routes `<a href>` clicks inside the block. The frame has no popup
 * permission and navigating it would just blank the block, so external URLs
 * (and `target="_blank"`) go to the parent to open a new tab, while app paths
 * drill through via `evidence.navigate`. Modifier/middle clicks, fragments,
 * `download`, non-http schemes, relative paths, and author-cancelled clicks are
 * left to the browser.
 */
import { isSafeExternalUrl, isSafeInternalPath } from './html-protocol';

export type LinkClickAction =
	| { kind: 'new-tab'; url: string }
	| { kind: 'same-tab'; path: string }
	| { kind: 'ignore' };

export function classifyLinkClick(event: MouseEvent): LinkClickAction {
	const ignore: LinkClickAction = { kind: 'ignore' };
	if (event.defaultPrevented) return ignore;
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return ignore;
	}
	const target = event.target;
	if (!(target instanceof Element)) return ignore;
	const anchor = target.closest('a[href]');
	if (!(anchor instanceof HTMLAnchorElement)) return ignore;
	if (anchor.hasAttribute('download')) return ignore;

	const href = (anchor.getAttribute('href') ?? '').trim();
	if (href === '' || href.startsWith('#')) return ignore;
	const wantsNewTab = (anchor.getAttribute('target') ?? '').toLowerCase() === '_blank';
	if (href.startsWith('/')) {
		if (!isSafeInternalPath(href)) return ignore;
		return wantsNewTab ? { kind: 'new-tab', url: href } : { kind: 'same-tab', path: href };
	}
	return isSafeExternalUrl(href) ? { kind: 'new-tab', url: href } : ignore;
}

export interface LinkClickHandlers {
	openNewTab: (url: string) => void;
	navigateSameTab: (path: string) => void;
}

/**
 * Listens on `window` (bubble phase) so author handlers on elements AND on
 * `document` run first and can `preventDefault()` to opt out. Returns an
 * uninstall fn.
 */
export function installLinkClickHandler(win: Window, handlers: LinkClickHandlers): () => void {
	const onClick = (event: MouseEvent): void => {
		const action = classifyLinkClick(event);
		if (action.kind === 'ignore') return;
		event.preventDefault();
		if (action.kind === 'new-tab') handlers.openNewTab(action.url);
		else handlers.navigateSameTab(action.path);
	};
	win.addEventListener('click', onClick);
	return () => win.removeEventListener('click', onClick);
}
