// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { setPageState } from '../../../shims/page-state';
import LinkButton from './LinkButton.svelte';

vi.mock('../../Renderer/renderer-context', () => ({
	getRendererContext: () => ({ context: 'preview' })
}));

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

function renderLinkButton(url: string): HTMLAnchorElement {
	setPageState({
		params: {
			organizationId: 'org_123',
			projectSlug: 'my-project',
			branch: 'feature~details'
		}
	});
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(LinkButton, {
		target,
		props: { url, title: 'Details', variant: 'default', new_tab: false }
	});
	flushSync();

	const anchor = target.querySelector('a');
	if (!anchor) throw new Error('LinkButton did not render an anchor');
	return anchor;
}

describe('LinkButton internal links', () => {
	it.each(['/details', 'details'])('rewrites the page-relative URL %s for preview', (url) => {
		expect(renderLinkButton(url).getAttribute('href')).toBe(
			'/preview/working/org_123/my-project/feature~details/details'
		);
	});

	it.each(['#details', '?view=table', '//example.com/details'])(
		'preserves the non-path URL %s',
		(url) => {
			expect(renderLinkButton(url).getAttribute('href')).toBe(url);
		}
	);

	it.each(['https://evidence.dev/docs', 'mailto:hi@evidence.dev', 'tel:+15551234567'])(
		'leaves the external URL %s unchanged',
		(url) => {
			expect(renderLinkButton(url).getAttribute('href')).toBe(url);
		}
	);

	it('still blanks an unsafe protocol', () => {
		expect(renderLinkButton('javascript:alert(1)').getAttribute('href')).toBe('about:blank');
	});
});
