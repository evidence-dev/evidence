// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { mount, unmount, flushSync, createRawSnippet } from 'svelte';
import PrintGroup from '../user-components/tags/print_group/PrintGroup.svelte';
import OnlyInPrint from '../user-components/tags/only_in_print/OnlyInPrint.svelte';
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

function createProse() {
	const prose = document.createElement('div');
	prose.className = 'prose';
	document.body.appendChild(prose);
	return prose;
}

function tocLinks() {
	const toc = document.createElement('div');
	document.body.appendChild(toc);
	mounted.push(mount(TableOfContents, { target: toc }));
	flushSync();
	return [...toc.querySelectorAll('a')].map((a) => a.textContent?.trim());
}

describe('TableOfContents', () => {
	it('omits headings inside print-only groups', () => {
		const prose = createProse();
		renderPrintGroup(prose, 'On screen', false);
		renderPrintGroup(prose, 'Print appendix', true);

		expect(tocLinks()).toEqual(['On screen']);
	});

	it('omits headings inside only_in_print blocks', () => {
		const prose = createProse();
		renderPrintGroup(prose, 'On screen', false);
		mounted.push(
			mount(OnlyInPrint, {
				target: prose,
				props: {
					children: createRawSnippet(() => ({ render: () => '<h2>Print appendix</h2>' }))
				} as never
			})
		);

		expect(tocLinks()).toEqual(['On screen']);
	});
});
