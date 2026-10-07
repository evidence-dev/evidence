// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { mount, unmount, flushSync, createRawSnippet } from 'svelte';
import PrintGroup from '../user-components/tags/print_group/PrintGroup.svelte';
import TableOfContents from './TableOfContents.svelte';

const mounted: ReturnType<typeof mount>[] = [];

beforeAll(() => {
	// jsdom doesn't implement innerText, which TableOfContents reads heading text from.
	Object.defineProperty(HTMLElement.prototype, 'innerText', {
		configurable: true,
		get() {
			return this.textContent;
		}
	});
});

afterEach(() => {
	mounted.splice(0).forEach((component) => unmount(component));
	document.body.innerHTML = '';
});

function renderPrintGroup(target: Element, heading: string, printOnly: boolean) {
	mounted.push(
		mount(PrintGroup, {
			target,
			props: {
				print_only: printOnly,
				children: createRawSnippet(() => ({ render: () => `<h2>${heading}</h2>` }))
			} as never
		})
	);
}

describe('TableOfContents', () => {
	it('omits headings inside print-only groups', () => {
		const prose = document.createElement('div');
		prose.className = 'prose';
		document.body.appendChild(prose);
		renderPrintGroup(prose, 'On screen', false);
		renderPrintGroup(prose, 'Print appendix', true);

		const toc = document.createElement('div');
		document.body.appendChild(toc);
		mounted.push(mount(TableOfContents, { target: toc }));
		flushSync();

		const links = [...toc.querySelectorAll('a')].map((a) => a.textContent?.trim());
		expect(links).toEqual(['On screen']);
	});
});
